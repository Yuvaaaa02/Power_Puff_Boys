import DashboardClient from "./DashboardClient";

export async function generateStaticParams() {
  return [
    { name: "Yuvaraj" },
    { name: "Anand" },
    { name: "Varshith" },
    { name: "Mahendra" }
  ];
}

export default function Page({ params }: { params: any }) {
  return <DashboardClient params={params} />;
}
