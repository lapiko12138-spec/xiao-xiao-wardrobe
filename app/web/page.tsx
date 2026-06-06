import { WebApp } from "@/components/web-app";
import { appData } from "@/lib/app-data";

export default function WebPage() {
  return <WebApp initialData={appData} />;
}
