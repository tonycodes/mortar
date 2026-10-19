import test from "node:test";
import assert from "node:assert/strict";
import { h, html, Testimonial, TeamGrid, Footer } from "./support/render.mjs";
const icon = h("svg", { viewBox: "0 0 24 24" });

test("Testimonial keeps its markup and adds a logo and avatar", () => {
  assert.equal(
    html(Testimonial, { quote: "It works.", name: "Ana" }),
    '<figure class="m-testimonial" data-m-component="Testimonial"><blockquote>It works.</blockquote><figcaption><strong>Ana</strong></figcaption></figure>',
  );
  const rich = html(Testimonial, {
    quote: "It works.",
    name: "Ana",
    role: "CTO, Wheelhouse",
    logo: h("img", { src: "/wheelhouse.svg", alt: "Wheelhouse" }),
    avatar: h("span", { "data-avatar": "" }),
  });
  assert.match(
    rich,
    /<div class="m-testimonial-logo"><img src="\/wheelhouse.svg" alt="Wheelhouse"\/><\/div><blockquote>/,
  );
  assert.match(
    rich,
    /<figcaption><span class="m-testimonial-avatar" aria-hidden="true"><span data-avatar=""><\/span><\/span><span class="m-testimonial-person"><strong>Ana<\/strong><span>CTO, Wheelhouse<\/span><\/span><\/figcaption>/,
  );
});

test("TeamGrid members can have a bio and named profile links", () => {
  const plain = html(TeamGrid, {
    title: "Team",
    members: [{ name: "Ana", role: "CTO" }],
  });
  assert.doesNotMatch(plain, /m-team-bio|m-icon-links/);
  const rich = html(TeamGrid, {
    title: "Team",
    members: [
      {
        name: "Ana Kovač",
        role: "CTO",
        bio: "Builds the platform.",
        links: [
          { label: "Ana Kovač on LinkedIn", href: "#in", icon },
          { label: "Website", href: "#web" },
        ],
      },
    ],
  });
  assert.match(rich, /<p class="m-team-bio">Builds the platform.<\/p>/);
  assert.match(rich, /<ul class="m-icon-links" aria-label="Ana Kovač links">/);
  assert.match(
    rich,
    /<a href="#in" aria-label="Ana Kovač on LinkedIn"><span aria-hidden="true"><svg/,
  );
  assert.match(rich, /<a href="#web">Website<\/a>/);
});

test("Footer adds a labelled list of social links", () => {
  const props = {
    brand: "Northwind",
    description: "Chat for small businesses.",
    columns: [],
    copyright: "© Northwind",
  };
  assert.doesNotMatch(html(Footer, props), /m-icon-links/);
  const rich = html(Footer, {
    ...props,
    social: [
      { label: "Northwind on Mastodon", href: "#mastodon", icon },
      { label: "Northwind on GitHub", href: "#github", icon },
    ],
  });
  assert.match(rich, /<ul class="m-icon-links" aria-label="Social media">/);
  assert.match(rich, /aria-label="Northwind on GitHub"/);
});
