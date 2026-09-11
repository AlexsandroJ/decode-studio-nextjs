import type { Metadata } from "next";
import { CANStudioProvider } from "@/context/CANStudioContext";
import { ViewerProvider } from "@/context/ViewerContext";
import "./globals.css";
import Toast from "@/components/Toast";

export const metadata: Metadata = {
  title: "Decoder Studio",
  description: "Ferramenta visual para decodificação de sinais CAN e sensores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <CANStudioProvider>
          <ViewerProvider>  
            {children}
            <Toast />
          </ViewerProvider>
        </CANStudioProvider>
      </body>
    </html>
  );
}
