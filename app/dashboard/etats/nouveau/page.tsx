// import React, { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Select } from '@/components/ui/select';
// import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

// const CreateEDBPage = () => {
//   const { register, handleSubmit, formState: { errors } } = useForm();
//   const [step, setStep] = useState(1);

//   const onSubmit = (data) => {
//     console.log(data);
//     // Handle form submission
//   };

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">Créer un nouvel État de Besoin</h1>
      
//       <Card>
//         <CardHeader>
//           <CardTitle>Étape {step} sur 3</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit(onSubmit)}>
//             {step === 1 && (
//               <>
//                 <Input 
//                   {...register("title", { required: true })} 
//                   placeholder="Titre"
//                   className="mb-4"
//                 />
//                 <Textarea 
//                   {...register("description", { required: true })} 
//                   placeholder="Description"
//                   className="mb-4"
//                 />
//                 <Select 
//                   {...register("category", { required: true })} 
//                   className="mb-4"
//                 >
//                   {/* Add category options */}
//                 </Select>
//               </>
//             )}
//             {step === 2 && (
//               <>
//                 {/* Add file upload component for attachments */}
//                 <Input 
//                   type="file" 
//                   {...register("attachments")} 
//                   multiple 
//                   className="mb-4"
//                 />
//               </>
//             )}
//             {step === 3 && (
//               <>
//                 {/* Add summary/review of entered information */}
//               </>
//             )}
//           </form>
//         </CardContent>
//         <CardFooter className="flex justify-between">
//           {step > 1 && (
//             <Button onClick={() => setStep(step - 1)}>Précédent</Button>
//           )}
//           {step < 3 ? (
//             <Button onClick={() => setStep(step + 1)}>Suivant</Button>
//           ) : (
//             <Button onClick={handleSubmit(onSubmit)}>Soumettre</Button>
//           )}
//         </CardFooter>
//       </Card>
//     </div>
//   );
// };

// export default CreateEDBPage;