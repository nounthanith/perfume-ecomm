import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import UserForm, { type UserFormData } from "@/components/shared/UserForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;

  await connectDB();
  const user = await User.findById(id).select("-password -googleId -otp -otpExpires").lean();

  if (!user) notFound();

  const initial: UserFormData = {
    name: user.name,
    email: user.email,
    role: user.role ?? "user",
    emailVerified: user.emailVerified ?? false,
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit User</h1>
        <Link
          href="/user-management"
          className="text-sm text-gray-500 hover:underline"
        >
          Back to users
        </Link>
      </div>

      <div className="mt-5">
        <UserForm mode="edit" userId={id} initial={initial} />
      </div>
    </div>
  );
}