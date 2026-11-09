import { Button, ThemeProvider } from "@tonycodes-ui/mortar";
import "./styles.css";

export function App() {
  return (
    <ThemeProvider>
      <div className="toolbar">
        <Button icon={<span aria-hidden="true">+</span>}>Add item</Button>
      </div>
    </ThemeProvider>
  );
}
