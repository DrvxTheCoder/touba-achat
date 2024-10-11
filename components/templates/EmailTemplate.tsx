import {
    Body,
    Button,
    Container,
    Column,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Text,
    Tailwind,
  } from "@react-email/components";
  import * as React from "react";
import { translateStatus } from "@/app/utils/translate-status";
  
  interface ToubaOilNotificationEmailProps {
    recipientName?: string;
    recipientEmail?: string;
    actionType: string;
    actionInitiator?: string;
    entityType?: string;
    entityId?: string;
    actionLink?: string;
    notificationDetails?: string;
  }
  
  
  export const ToubaOilNotificationEmail = ({
    recipientName,
    recipientEmail,
    actionType,
    actionInitiator,
    entityType,
    entityId,
    actionLink,
    notificationDetails,
  }: ToubaOilNotificationEmailProps) => {
    const previewText = `(${translateStatus(actionType)}) - ${actionInitiator}`;
  
    return (
      <Html>
        <Head />
        <Preview>{previewText}</Preview>
        <Tailwind>
          <Body className="bg-white my-auto mx-auto font-sans px-5">
            <div className="rounded my-[40px] mx-auto max-w-[465px]">
              <Section className="mt-[32px]">
                <Img
                  src="https://touba-achat.vercel.app/assets/img/touba-app192x192.png"
                  width="50"
                  alt="TOUBA OIL"
                  className="my-0 mx-auto"
                />
              </Section>
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                <strong>Touba-App™</strong>
              </Heading>
              <Text className="text-black text-[14px] leading-[24px]">
                Bonjour {recipientName},
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                {notificationDetails}
              </Text>
              <Text>
                Veuillez vous connecter à l&apos;application pour plus de détails.
              </Text>
  
              <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                  className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                  href={actionLink}
                >
                  Acceder au dashboard
                </Button>
              </Section>
              {/* <Text className="text-black text-[12px] leading-[24px]">
                ou cliquez sur {" "} 
                <Link href={actionLink} className="text-blue-600 underline">
                  ce lien
                </Link>
                <br/>

              </Text> */}
              <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
              <Text className="text-[#666666] text-[12px] leading-[24px] text-justify">
                Ceci est un message automatique destiné à {" "}
                <strong className="text-black">{recipientEmail}</strong>, envoyé par l&apos;application <strong>ToubaApp™</strong>.{" "}
                Si cette notification ne vous concerne pas, vous pouvez l&apos;ignorer. Contactez votre Service Informatique si vous êtes préoccupé par la sécurité de votre compte.
              </Text>
            </div>
          </Body>
        </Tailwind>
      </Html>
    );
  };
  
  ToubaOilNotificationEmail.PreviewProps = {
    recipientName: "Alboury Ndao",
    recipientEmail: "alboury.ndao@touba-oil.com",
    actionType: "créé",
    actionInitiator: "Paul Ismael FLAN",
    entityType: "EDB",
    entityId: "EDB-2023-001",
    actionLink: "https://touba-achat.vercel.app/dashboard/etats/EDB-2023-001",
    notificationDetails: "L'EDB nécessite votre approbation. Veuillez examiner les détails et prendre les mesures appropriées.",
  } as ToubaOilNotificationEmailProps;
  
  export default ToubaOilNotificationEmail;