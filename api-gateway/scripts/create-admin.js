const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@smartvod.local";
  const plainPassword = process.env.ADMIN_PASSWORD || "Admin@123456";
  const fullName = process.env.ADMIN_FULLNAME || "System Admin";

  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        fullName,
        role: "ADMIN",
        passwordHash,
      },
    });

    console.log(
      JSON.stringify(
        {
          action: "updated",
          user: {
            id: updated.id,
            fullName: updated.fullName,
            email: updated.email,
            role: updated.role,
          },
          password: plainPassword,
        },
        null,
        2,
      ),
    );
    return;
  }

  const created = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(
    JSON.stringify(
      {
        action: "created",
        user: {
          id: created.id,
          fullName: created.fullName,
          email: created.email,
          role: created.role,
        },
        password: plainPassword,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
