import { useState, type ReactNode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import {
  ActionLink,
  Button,
  Dropdown,
  Listbox,
  Modal,
  Notice,
  SaveBar,
  Tabs,
  ThemeProvider,
  Toaster,
  type ToastItem,
} from "../../../../src/index.js";
import "../../../../playground/styles.css";

const scenario = new URLSearchParams(location.search).get("case");
const root = document.getElementById("root");
if (!root) throw new Error("missing fixture root");

function Overlays() {
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState<string | null>(null);
  return (
    <>
      <Dropdown
        label="Actions"
        items={[{ label: "Edit" }, { label: "Copy" }]}
      />
      <Listbox
        label="Owner"
        value={owner}
        onChange={setOwner}
        options={[
          { value: "ana", label: "Ana" },
          { value: "tom", label: "Tom" },
        ]}
      />
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Settings">
        <p>Dialog content</p>
      </Modal>
    </>
  );
}

function Loading() {
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <Button
        type="submit"
        loading={loading}
        onClick={() => {
          setCount((n) => n + 1);
          setLoading(true);
        }}
      >
        Save
      </Button>
      <output aria-label="Saves">{count}</output>
    </form>
  );
}

function ToasterCase() {
  const [items, setItems] = useState<ToastItem[]>([
    { id: "a", title: "First toast" },
    { id: "b", title: "Second toast" },
  ]);
  const add = (item: ToastItem) => setItems((list) => [...list, item]);
  return (
    <>
      <Button onClick={() => add({ id: "c", title: "Copied URL" })}>
        Add polite
      </Button>
      <Button
        onClick={() =>
          add({ id: "d", title: "Payment failed", tone: "danger" })
        }
      >
        Add danger
      </Button>
      <Toaster
        items={items}
        onDismiss={(id) => setItems((list) => list.filter((t) => t.id !== id))}
      />
    </>
  );
}

function NoticeCase() {
  const [shown, setShown] = useState(true);
  const [announced, setAnnounced] = useState(false);
  return (
    <>
      <Button variant="secondary">Before</Button>
      {shown && (
        <Notice title="Heads up" onDismiss={() => setShown(false)}>
          Something changed.
        </Notice>
      )}
      <Button variant="secondary">After</Button>
      <Button onClick={() => setAnnounced(true)}>Save settings</Button>
      {announced && <Notice title="Settings saved" announce />}
    </>
  );
}

function SaveBarCase() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit</Button>
      <SaveBar
        open={open}
        onSave={() => setOpen(false)}
        onDiscard={() => setOpen(false)}
      />
    </>
  );
}

function TabsCase({ value: initial }: { value: string }) {
  const [value, setValue] = useState(initial);
  return (
    <Tabs
      label="Sections"
      value={value}
      onChange={setValue}
      items={[
        { id: "one", label: "One", content: "First panel" },
        { id: "two", label: "Two", content: "Second panel" },
        { id: "three", label: "Three", content: "Third panel" },
      ]}
    />
  );
}

const acme = {
  light: { primary: "#1d4ed8", onPrimary: "#ffffff" },
  dark: { primary: "#93c5fd", onPrimary: "#0b1f4d" },
};

const routes: string[] = [];
function NavigationCase() {
  const [, rerender] = useState(0);
  return (
    <ThemeProvider
      navigate={(href) => {
        routes.push(href);
        rerender((n) => n + 1);
      }}
    >
      <ThemeProvider scope="container" appearance="dark">
        <ActionLink label="Next page" href="/next" />
      </ThemeProvider>
      <output aria-label="Routes">{routes.join(",")}</output>
    </ThemeProvider>
  );
}

let content: ReactNode;
switch (scenario) {
  case "container-dark":
    content = (
      <ThemeProvider scope="container" appearance="dark">
        <div style={{ padding: 16 }}>
          <Overlays />
        </div>
      </ThemeProvider>
    );
    break;
  case "container-light":
    // A light container inside a dark document.
    document.documentElement.setAttribute("data-mortar", "");
    document.documentElement.setAttribute("data-mortar-appearance", "dark");
    content = (
      <ThemeProvider scope="container" appearance="light">
        <div style={{ padding: 16 }}>
          <Overlays />
        </div>
      </ThemeProvider>
    );
    break;
  case "brand-container":
    // A runtime brand on a dark container inside a light document.
    content = (
      <ThemeProvider
        scope="container"
        appearance="dark"
        brand="acme"
        brandTokens={acme}
      >
        <div style={{ padding: 16 }}>
          <Button>Primary</Button>
          <Overlays />
        </div>
      </ThemeProvider>
    );
    break;
  case "brand-document":
    content = (
      <ThemeProvider appearance="light" brand="acme" brandTokens={acme}>
        <Button>Primary</Button>
        <section data-tone="inverse" aria-label="Inverse band">
          <Button>Inverse primary</Button>
        </section>
      </ThemeProvider>
    );
    break;
  case "navigation":
    content = <NavigationCase />;
    break;
  case "loading":
    content = (
      <ThemeProvider appearance="light">
        <Loading />
      </ThemeProvider>
    );
    break;
  case "toaster":
    content = (
      <ThemeProvider appearance="light">
        <ToasterCase />
      </ThemeProvider>
    );
    break;
  case "notice":
    content = (
      <ThemeProvider appearance="light">
        <NoticeCase />
      </ThemeProvider>
    );
    break;
  case "savebar":
    content = (
      <ThemeProvider appearance="light">
        <SaveBarCase />
      </ThemeProvider>
    );
    break;
  case "tabs-rtl":
    content = (
      <div dir="rtl">
        <TabsCase value="one" />
      </div>
    );
    break;
  case "tabs-missing":
    content = (
      <>
        <Button variant="secondary">Before tabs</Button>
        <TabsCase value="missing" />
      </>
    );
    break;
  case "hydrate": {
    // Hydrate the markup a server renders (it has no window, so a system
    // appearance is light there; tests/controls-api.test.mjs checks that).
    root.innerHTML =
      '<div data-m-component="ThemeProvider" data-mortar="" data-mortar-brand="neutral" data-mortar-density="comfortable" data-mortar-appearance="light"><p>Hydrated</p></div>';
    hydrateRoot(
      root,
      <ThemeProvider scope="container" initialAppearance="system">
        <p>Hydrated</p>
      </ThemeProvider>,
    );
    break;
  }
  default:
    content = <p>Unknown case</p>;
}
if (scenario !== "hydrate") createRoot(root).render(content);
