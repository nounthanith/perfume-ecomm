import ButtonLogout from "../providers/ButtonLogout";

export default function ClientLayout() {
    return <div className="space-x-4">
        {["login", "register", 'profile', '/'].map((path) => (
            <a className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100" key={path} href={path}>
                {path}
            </a>
        ))}
        <ButtonLogout />
    </div>
}