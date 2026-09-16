import Button from "@/components/ui/button";
import Link from "next/link";

export default function Dashbaord() {
    return <div>
        <Link href="/" ><Button>Go to Site</Button></Link>
        <Link href="/pos" ><Button>Go to POS</Button></Link>
    </div>
}