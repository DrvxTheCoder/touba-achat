import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

// TODO: Replace this with your actual authentication logic
const auth = (req: Request) => ({ id: 'fakeId' }); // Fake auth function

export const ourFileRouter = {
  avatar: f({ image: { maxFileSize: '4MB' } })
    .middleware(({ req }) => auth(req))
    .onUploadComplete((data) => console.log('Avatar uploaded:', data)),

  generalMedia: f({
    'application/pdf': { maxFileSize: '2MB', maxFileCount: 3 },
  })
    .middleware(async ({ req }) => {
      // Run any authentication or validation logic here
      const user = await auth(req);

      // If you throw, the user will not be able to upload
      if (!user) throw new Error("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on your server after upload
      console.log("EDB document uploaded for userId:", metadata.userId);
      console.log("File details:", {
        name: file.name,
        size: file.size,
        key: file.key,
        url: file.url,
      });

      // Here you could save the file information to your database
      // await saveFileToDatabase(metadata.userId, file);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;