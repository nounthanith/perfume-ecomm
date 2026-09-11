import ButtonLogout from "../providers/ButtonLogout";

export default function ClientLayout() {
    const navItems = [
        { label: "Home", path: "/" },
        { label: "Login", path: "/login" },
        { label: "Register", path: "/register" },
        { label: "Profile", path: "/profile" },
    ];

    return (
        <nav className="flex flex-wrap border-b border-foreground/10 items-center justify-center gap-2 p-4 sm:justify-start">
            {navItems.map((item) => (
                <a
                    key={item.path}
                    href={item.path}
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                    {item.label}
                </a>
            ))}
            <ButtonLogout />
        </nav>
    );
}