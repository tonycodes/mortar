import { Button, ThemeProvider } from "@tonycodes-ui/mortar";
import "./styles.css";

export function App() {
  return (
    <ThemeProvider>
      <div className="toolbar">
        <button type="button">Native</button>
      </div>
      <Button>Save</Button>
    </ThemeProvider>
  );
}
