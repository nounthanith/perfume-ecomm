import Link from "next/link";
import UserForm from "@/components/UserForm";

export default function CreateUserPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create User</h1>
        <Link
          href="/user-management"
          className="text-sm text-gray-500 hover:underline"
        >
          Back to users
        </Link>
      </div>

      <div className="mt-5">
        <UserForm mode="create" />
      </div>
    </div>
  );
}