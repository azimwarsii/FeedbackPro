import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
        const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

        if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
            console.error("Missing Cloudflare credentials in environment variables");
            return NextResponse.json({ error: "Cloudflare configuration missing" }, { status: 500 });
        }

        // 1. Request a one-time upload URL from Cloudflare
        // Or just upload directly if you have the token
        const cfFormData = new FormData();
        cfFormData.append("file", file);

        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
                },
                body: cfFormData,
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error("Cloudflare upload error:", result);
            return NextResponse.json({ error: "Failed to upload to Cloudflare" }, { status: response.status });
        }

        // Cloudflare returns variants. Usually "public" is the default.
        const imageUrl = result.result.variants[0];

        return NextResponse.json({ url: imageUrl });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
