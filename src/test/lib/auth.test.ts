import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  emailSchema,
  passwordSchema,
  nameSchema,
  loginSchema,
  registerSchema,
} from "@/lib/auth";

describe("hashPassword", () => {
  it("パスワードをハッシュ化できる", async () => {
    const password = "password123";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it("同じパスワードでも異なるハッシュ値が生成される", async () => {
    const password = "password123";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });

  it("空文字の場合はエラーがスローされる", async () => {
    await expect(hashPassword("")).rejects.toThrow("Password is required");
  });
});

describe("verifyPassword", () => {
  it("正しいパスワードでtrueを返す", async () => {
    const password = "password123";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);

    expect(isValid).toBe(true);
  });

  it("間違ったパスワードでfalseを返す", async () => {
    const password = "password123";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword("wrongpassword", hash);

    expect(isValid).toBe(false);
  });

  it("空のパスワードでfalseを返す", async () => {
    const hash = await hashPassword("password123");
    const isValid = await verifyPassword("", hash);

    expect(isValid).toBe(false);
  });

  it("空のハッシュでfalseを返す", async () => {
    const isValid = await verifyPassword("password123", "");

    expect(isValid).toBe(false);
  });
});

describe("emailSchema", () => {
  it("正常なメールアドレスを受け入れる", () => {
    const result = emailSchema.safeParse("test@example.com");
    expect(result.success).toBe(true);
  });

  it("サブドメイン付きメールアドレスを受け入れる", () => {
    const result = emailSchema.safeParse("test@sub.example.com");
    expect(result.success).toBe(true);
  });

  it("@なしのメールアドレスを拒否する", () => {
    const result = emailSchema.safeParse("testexample.com");
    expect(result.success).toBe(false);
  });

  it("ドメインなしのメールアドレスを拒否する", () => {
    const result = emailSchema.safeParse("test@");
    expect(result.success).toBe(false);
  });

  it("空文字を拒否する", () => {
    const result = emailSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("日本語を含むメールアドレスを拒否する", () => {
    const result = emailSchema.safeParse("テスト@example.com");
    expect(result.success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("8文字以上のパスワードを受け入れる", () => {
    const result = passwordSchema.safeParse("password123");
    expect(result.success).toBe(true);
  });

  it("8文字ちょうどのパスワードを受け入れる", () => {
    const result = passwordSchema.safeParse("pass1234");
    expect(result.success).toBe(true);
  });

  it("7文字のパスワードを拒否する", () => {
    const result = passwordSchema.safeParse("pass123");
    expect(result.success).toBe(false);
  });

  it("空文字を拒否する", () => {
    const result = passwordSchema.safeParse("");
    expect(result.success).toBe(false);
  });
});

describe("nameSchema", () => {
  it("正常なユーザー名を受け入れる", () => {
    const result = nameSchema.safeParse("山田太郎");
    expect(result.success).toBe(true);
  });

  it("空文字を拒否する", () => {
    const result = nameSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("100文字を超えるユーザー名を拒否する", () => {
    const longName = "a".repeat(101);
    const result = nameSchema.safeParse(longName);
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("正常なログインデータを受け入れる", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("メールアドレスが不正な場合に拒否する", () => {
    const result = loginSchema.safeParse({
      email: "invalid",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("正常な登録データを受け入れる", () => {
    const result = registerSchema.safeParse({
      name: "山田太郎",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("パスワードが一致しない場合に拒否する", () => {
    const result = registerSchema.safeParse({
      name: "山田太郎",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });
});
