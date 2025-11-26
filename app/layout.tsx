import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core";

export const metadata = {
  title: "CopilotKit + Google ADK Search",
  description: "AI-powered search assistant with Google ADK and CopilotKit",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CopilotKit runtimeUrl="/api/copilotkit" agent="search_agent">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
