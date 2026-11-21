import { notFound } from "next/navigation";
import WrongQuestions from "@/components/WrongQuestions";

const subjects: Record<string, string> = {
  math: "算数",
  japanese: "国語",
  science: "理科",
  social: "社会"
};

export default async function SubjectPage({
  params
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  const label = Object.prototype.hasOwnProperty.call(subjects, subject) ? subjects[subject] : undefined;
  if (!label) notFound();
  return <WrongQuestions key={label} subject={label} />;
}
