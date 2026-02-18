# Prisma + Supabase

**Recommended (reference_demo_project style):** Use the **Direct** connection with SSL disabled. In Supabase Dashboard → **Connect** → **Direct connection**, copy the URI and add `?sslmode=disable`. No certificate file is needed. See app `README.md` → Env → `DATABASE_URL`.

---

## If you use SSL (pooler or SSL enforcement ON)

If you see "Bad certificate format" or connect with SSL:

1. In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Project Settings** (gear) → **Database**.
2. Under **SSL Configuration**, download the **Server root certificate** (e.g. `prod-supabase.cer`).
3. Save it in this folder as **`supabase-root.crt`** (rename from `.cer` if needed).
4. In `app/.env`, set `DATABASE_URL` to use the cert, e.g. append: `?sslmode=require&sslrootcert=supabase-root.crt`
5. Do not commit the cert; it’s in `.gitignore`.
