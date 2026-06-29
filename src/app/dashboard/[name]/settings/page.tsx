import SettingsClient from "./SettingsClient";

export async function generateStaticParams() {
  return [
    { name: "Yuvaraj" },
    { name: "Anand" },
    { name: "Varshith" },
    { name: "Mahendra" }
  ];
}

export default function Page({ params }: { params: any }) {
  return <SettingsClient params={params} />;
}
