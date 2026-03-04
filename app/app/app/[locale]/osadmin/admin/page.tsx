import { redirect } from "next/navigation";

export default function AdminRoot() {
    redirect("/osadmin/admin/dashboard");
}
