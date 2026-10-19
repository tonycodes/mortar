import test from "node:test";
import assert from "node:assert/strict";
import { h, html as markup, UI } from "./support/render.mjs";

const action = { label: "Choose", href: "/choose" };
const group = {
  label: "Product",
  items: [{ label: "A", href: "/a", description: "Desc" }],
  footer: [action],
};
const headerProps = {
  brand: "Acme",
  links: [group, { label: "Pricing", href: "/pricing" }],
  action,
};
const footerProps = {
  brand: "Acme",
  description: "Desc",
  columns: [{ label: "Product", items: [action] }],
  copyright: "© Acme",
  legal: [action],
};
const contactProps = {
  title: "Talk",
  description: "Soon",
  details: [{ label: "Email", value: "a@b.c" }],
};
const post = {
  href: "/p",
  title: "Post",
  excerpt: "Ex",
  date: "2026-01-01",
  dateLabel: "1 Jan",
  category: "News",
  image: h("img", { alt: "", src: "/i.png" }),
};

// Default markup captured from the build before these variants were added.
test("default markup of the marketing chrome is unchanged", () => {
  assert.equal(
    markup(UI.MarketingHeader, headerProps),
    '<header class="m-marketing-header" data-m-component="MarketingHeader"><a class="m-brand" href="/"><span class="m-mark" aria-hidden="true"></span>Acme</a><button data-m-component="Button" aria-expanded="false" aria-controls="m-marketing-navR0" type="button" class="m-button m-button-ghost m-menu-trigger">Menu</button><nav id="m-marketing-navR0" aria-label="Primary"><div class="m-flyout" data-headlessui-state=""><button class="m-flyout-trigger" type="button" aria-expanded="false" data-headlessui-state="">Product<svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path d="m6 8 4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></button></div><span hidden="" style="position:fixed;top:1px;left:1px;width:1px;height:0;padding:0;margin:-1px;overflow:hidden;clip:rect(0, 0, 0, 0);white-space:nowrap;border-width:0;display:none"></span><a href="/pricing">Pricing</a></nav><div class="m-actions"><a data-m-component="ActionLink" class="m-button m-button-primary" href="/choose">Choose</a></div></header>',
  );
  assert.equal(
    markup(UI.Footer, footerProps),
    '<footer class="m-footer" data-m-component="Footer"><div class="m-footer-grid"><div><strong class="m-brand"><span class="m-mark" aria-hidden="true"></span>Acme</strong><p>Desc</p></div><nav aria-label="Product"><h2>Product</h2><a href="/choose">Choose</a></nav></div><div class="m-footer-bottom"><span>© Acme</span><div><a href="/choose">Choose</a></div></div></footer>',
  );
  assert.equal(
    markup(UI.Banner, { action, onDismiss() {} }, "News"),
    '<section class="m-banner" aria-label="Announcement" data-tone="inverse" data-m-component="Banner"><p>News <a href="/choose">Choose<span aria-hidden="true"> →</span></a></p><button type="button" aria-label="Dismiss announcement"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"></path></svg></button></section>',
  );
  assert.equal(
    markup(UI.Newsletter, {
      title: "News",
      description: "Monthly",
      onSubmit() {},
    }),
    '<section class="m-newsletter" data-m-component="Newsletter"><div><h2 class="m-section-title">News</h2><p>Monthly</p></div><form><div data-m-component="Input" class="m-field"><label for="_R_6_">Email address<span class="m-required" aria-hidden="true">*</span></label><div class="m-input-group"><input type="email" autoComplete="email" required="" id="_R_6_" value=""/></div></div><button data-m-component="Button" type="submit" class="m-button m-button-primary">Subscribe</button><p role="status" class="m-newsletter-status"></p></form></section>',
  );
  assert.equal(
    markup(UI.ContactSection, contactProps, h("p", null, "Form")),
    '<section class="m-contact" data-m-component="ContactSection"><div><h2 class="m-section-title">Talk</h2><p class="m-section-description">Soon</p><dl><div><dt>Email</dt><dd>a@b.c</dd></div></dl></div><div class="m-contact-form"><p>Form</p></div></section>',
  );
  assert.equal(
    markup(UI.TeamGrid, {
      title: "Team",
      members: [{ name: "Ana", role: "Founder", bio: "Bio" }],
    }),
    '<section class="m-marketing-section" data-m-component="TeamGrid"><h2 class="m-section-title">Team</h2><ul class="m-team-grid"><li><div class="m-team-portrait"><span data-m-component="Avatar" class="m-avatar m-avatar-lg" data-shape="square" aria-hidden="true"><span aria-hidden="true">A</span></span></div><strong>Ana</strong><span>Founder</span><p class="m-team-bio">Bio</p></li></ul></section>',
  );
  assert.equal(
    markup(UI.PostList, { title: "Blog", posts: [post], action }),
    '<link rel="preload" as="image" href="/i.png"/><section class="m-marketing-section" data-m-component="PostList"><div class="m-section-heading-row"><div><h2 class="m-section-title">Blog</h2></div><a data-m-component="ActionLink" class="m-button m-button-secondary" href="/choose">Choose</a></div><ul class="m-post-list"><li><article><div class="m-post-image"><img alt="" src="/i.png"/></div><p class="m-post-meta"><span>News</span><time dateTime="2026-01-01">1 Jan</time></p><h3 class="m-post-title"><a href="/p">Post</a></h3><p>Ex</p></article></li></ul></section>',
  );
  assert.equal(
    markup(UI.TestimonialGrid, {
      title: "Love",
      items: [{ quote: "Great", name: "Ana", role: "CEO" }],
    }),
    '<section class="m-marketing-section" data-m-component="TestimonialGrid"><h2 class="m-section-title">Love</h2><div class="m-testimonial-grid"><figure><blockquote>Great</blockquote><figcaption><span data-m-component="Avatar" class="m-avatar m-avatar-sm" aria-hidden="true"><span aria-hidden="true">A</span></span><span><strong>Ana</strong><span>CEO</span></span></figcaption></figure></div></section>',
  );
});

test("explicit default values render the default markup", () => {
  assert.equal(
    markup(UI.MarketingHeader, {
      ...headerProps,
      layout: "inline",
      mobileMenu: "inline",
      links: [{ ...group, layout: "list" }, headerProps.links[1]],
    }),
    markup(UI.MarketingHeader, headerProps),
  );
  assert.equal(
    markup(UI.Footer, { ...footerProps, layout: "columns" }),
    markup(UI.Footer, footerProps),
  );
  assert.equal(
    markup(UI.Banner, { variant: "bar", placement: "inline" }, "News"),
    markup(UI.Banner, {}, "News"),
  );
  assert.equal(
    markup(UI.TeamGrid, { title: "T", members: [], layout: "grid" }),
    markup(UI.TeamGrid, { title: "T", members: [] }),
  );
  assert.equal(
    markup(UI.TestimonialGrid, { items: [], layout: "masonry" }),
    markup(UI.TestimonialGrid, { items: [] }),
  );
});

test("MarketingHeader center puts the links before the brand, in visual order", () => {
  const html = markup(UI.MarketingHeader, {
    ...headerProps,
    layout: "center",
  });
  assert.match(html, /data-layout="center"/);
  const menu = html.indexOf("m-menu-trigger");
  const nav = html.indexOf("<nav");
  const brand = html.indexOf('class="m-brand"');
  const actions = html.indexOf('class="m-actions"');
  assert.ok(menu < nav && nav < brand && brand < actions);
});

test("MarketingHeader panel menu opens a dialog instead of expanding the nav", () => {
  const html = markup(UI.MarketingHeader, {
    ...headerProps,
    mobileMenu: "panel",
  });
  assert.match(html, /data-menu="panel"/);
  assert.match(
    html,
    /<button data-m-component="Button" aria-haspopup="dialog" aria-expanded="false" type="button" class="m-button m-button-ghost m-menu-trigger">Menu<\/button>/,
  );
  assert.doesNotMatch(html, /aria-controls/);
  // The dialog renders only while open.
  assert.doesNotMatch(html, /m-marketing-panel/);
});

test("flyout groups expose their layout on the popover", () => {
  const html = markup(UI.MarketingHeader, {
    brand: "Acme",
    links: [
      { ...group, label: "Two", layout: "columns" },
      { ...group, label: "Wide", layout: "full" },
    ],
  });
  assert.match(html, /<div class="m-flyout" data-layout="columns"/);
  assert.match(html, /<div class="m-flyout" data-layout="full"/);
});

test("Footer center drops the visible column headings and centres one block", () => {
  const html = markup(UI.Footer, {
    ...footerProps,
    layout: "center",
    social: [{ label: "Acme on GitHub", href: "/gh" }],
  });
  assert.match(
    html,
    /<footer class="m-footer" data-m-component="Footer" data-layout="center">/,
  );
  assert.match(
    html,
    /<div class="m-footer-center"><strong class="m-brand">.*<\/strong><p>Desc<\/p><nav aria-label="Product"><a href="\/choose">Choose<\/a><\/nav><ul class="m-icon-links" aria-label="Social media">/,
  );
  assert.doesNotMatch(html, /<h2>|m-footer-grid/);
});

test("Footer newsletter slot sits above the bottom row", () => {
  const html = markup(UI.Footer, {
    ...footerProps,
    newsletter: h(UI.Newsletter, { title: "News", onSubmit() {} }),
  });
  assert.match(
    html,
    /<\/div><div class="m-footer-newsletter"><section class="m-newsletter" data-m-component="Newsletter">.*<\/section><\/div><div class="m-footer-bottom">/,
  );
});

test("Banner floating and bottom placement", () => {
  const floating = markup(UI.Banner, { variant: "floating" }, "News");
  assert.match(floating, /data-variant="floating"/);
  assert.doesNotMatch(floating, /<button/);
  // A bottom banner always offers a dismiss button, even without onDismiss.
  const bottom = markup(
    UI.Banner,
    { placement: "bottom", dismissLabel: "Dismiss notice" },
    "Cookies",
  );
  assert.match(bottom, /data-placement="bottom"/);
  assert.match(bottom, /<button type="button" aria-label="Dismiss notice">/);
});

test("Newsletter center layout and panel variant", () => {
  const html = markup(UI.Newsletter, {
    title: "News",
    onSubmit() {},
    layout: "center",
    variant: "panel",
  });
  assert.match(
    html,
    /<section class="m-newsletter" data-m-component="Newsletter" data-layout="center" data-variant="panel">/,
  );
  assert.match(html, /<p role="status" class="m-newsletter-status"><\/p>/);
});

test("ContactSection media splits beside the intro and form", () => {
  const html = markup(
    UI.ContactSection,
    { ...contactProps, media: h("img", { alt: "", src: "/office.jpg" }) },
    h("p", null, "Form"),
  );
  assert.match(
    html,
    /data-media="true"><div class="m-contact-media"><img alt="" src="\/office.jpg"\/><\/div><div class="m-contact-body"><div><h2 class="m-section-title">Talk<\/h2>.*<\/dl><\/div><div class="m-contact-form"><p>Form<\/p><\/div><\/div><\/section>/,
  );
});

test("ContactSection offices are headed addresses; the form is optional", () => {
  const html = markup(UI.ContactSection, {
    title: "Offices",
    headingLevel: 3,
    offices: [
      { name: "London", address: "1 Street" },
      { name: "Lisbon", address: "2 Rua" },
    ],
  });
  assert.match(
    html,
    /<ul class="m-contact-offices"><li><h4>London<\/h4><address>1 Street<\/address><\/li><li><h4>Lisbon<\/h4><address>2 Rua<\/address><\/li><\/ul>/,
  );
  assert.doesNotMatch(html, /m-contact-form/);
});

test("TeamGrid large and list layouts", () => {
  for (const layout of ["large", "list"])
    assert.match(
      markup(UI.TeamGrid, {
        title: "Team",
        layout,
        members: [{ name: "Ana", role: "Founder" }],
      }),
      new RegExp(`<ul class="m-team-grid" data-layout="${layout}"><li>`),
    );
});

test("PostList marks a featured post", () => {
  const html = markup(UI.PostList, {
    title: "Blog",
    posts: [
      { ...post, featured: true },
      { ...post, href: "/q" },
    ],
  });
  assert.match(
    html,
    /<li data-featured="true"><article><div class="m-post-image">/,
  );
  assert.equal((html.match(/data-featured/g) || []).length, 1);
});

test("TestimonialGrid grid layout and a featured quote", () => {
  const html = markup(UI.TestimonialGrid, {
    layout: "grid",
    items: [
      { quote: "Great", name: "Ana", featured: true },
      { quote: "Good", name: "Ben" },
    ],
  });
  assert.match(
    html,
    /<div class="m-testimonial-grid" data-layout="grid"><figure data-featured="true"><blockquote>Great/,
  );
  assert.equal((html.match(/data-featured/g) || []).length, 1);
});
