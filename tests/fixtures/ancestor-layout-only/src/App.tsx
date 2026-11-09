import { Button, ThemeProvider } from "@tonycodes-ui/mortar";
import "./styles.css";

export function App() {
  return (
    <ThemeProvider>
      <div className="toolbar">
        <Button>Save</Button>
      </div>
    </ThemeProvider>
  );
}
