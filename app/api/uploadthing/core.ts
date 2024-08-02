import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

const f = createUploadthing();

const auth = async (req: Request) => {
  const session = await getServerSession(authOptions);
  return session?.user;
};

export const ourFileRouter = {
  avatar: f({ image: { maxFileSize: '4MB' } })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user || !user.id) throw new Error("Unauthorized");
      return { userId: user.id.toString() };
    })
    .onUploadComplete((data) => console.log('Avatar uploaded:', data)),

  generalMedia: f({
    'application/pdf': { maxFileSize: '2MB', maxFileCount: 3 },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user || !user.id) throw new Error("Unauthorized");
      return { userId: user.id.toString() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("EDB document uploaded for userId:", metadata.userId);
      console.log("File details:", {
        name: file.name,
        size: file.size,
        key: file.key,
        url: file.url,
      });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;