import Link from "next/link";
import {
    ArrowUpRight,
    CreditCard,
    Gem,
    Mail,
    MapPin,
    Phone,
} from "lucide-react";

// TODO: replace the placeholder contact details and social URLs below with the
// real store information before launch.
const shopLinks = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: "Checkout", href: "/checkout" },
    { label: "My Account", href: "/profile" },
];

const supportLinks = [
    { label: "Shipping & Delivery", href: "#" },
    { label: "Returns & Exchanges", href: "#" },
    { label: "Track Your Order", href: "#" },
    { label: "FAQ", href: "#" },
];

const socialLinks = [
    { label: "Facebook", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "TikTok", href: "#" },
];

const linkClass =
    "text-sm text-background/60 transition-colors hover:text-background";

export default function Footer() {
    return (
        <footer className="bg-foreground text-background">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="inline-flex items-center gap-2.5">
                            <span className="flex h-10 w-10 items-center justify-center bg-background text-foreground">
                                <Gem className="h-5 w-5" />
                            </span>
                            <span className="text-xl font-bold tracking-tight">
                                G-Fragrance
                            </span>
                        </Link>
                        <p className="max-w-xs text-sm leading-relaxed text-background/60">
                            Discover premium perfumes and exotic fragrances crafted for every
                            occasion. Luxury scents, delivered with care.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            {socialLinks.map((social) => (
                                <Link
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-background/60 transition-colors hover:text-background"
                                >
                                    {social.label}
                                    <ArrowUpRight className="h-3 w-3" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-background">
                            Shop
                        </h2>
                        <ul className="space-y-3">
                            {shopLinks.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className={linkClass}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer care */}
                    <div>
                        <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-background">
                            Customer Care
                        </h2>
                        <ul className="space-y-3">
                            {supportLinks.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className={linkClass}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-background">
                            Get in Touch
                        </h2>
                        <ul className="space-y-4 text-sm text-background/60">
                            <li className="flex gap-3">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>123 Fragrance Lane, Phnom Penh, Cambodia</span>
                            </li>
                            <li className="flex gap-3">
                                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                                <a href="tel:+85512345678" className="transition-colors hover:text-background">
                                    +855 12 345 678
                                </a>
                            </li>
                            <li className="flex gap-3">
                                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                                <a
                                    href="mailto:hello@gfragrance.example"
                                    className="transition-colors hover:text-background"
                                >
                                    nounthanith99@gmail.com
                                </a>
                            </li>
                            {/* <li className="pt-1 text-xs leading-relaxed">
                                Mon – Sat: 9:00 AM – 6:00 PM
                                <br />
                                Sunday: Closed
                            </li> */}
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-4 border-t border-background/15 pt-6 text-xs text-background/50 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        © {new Date().getFullYear()} Nuon Thanith. All rights reserved.
                    </p>
                    <p className="inline-flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Secure payments powered by ABA PayWay · Visa · Mastercard · KHQR
                    </p>
                </div>
            </div>
        </footer>
    );
}
