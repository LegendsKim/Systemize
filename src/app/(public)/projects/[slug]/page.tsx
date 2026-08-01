import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/features/portfolio/components/ProjectDetail";
import {
  getProject,
  projectSlugs,
  type ProjectSlug,
} from "@/features/portfolio/portfolio-content";
import { pageMetadata } from "@/lib/seo/page-metadata";

interface ProjectPageProps {
  readonly params: Promise<{ slug: ProjectSlug }>;
}

export function generateStaticParams() {
  return projectSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return pageMetadata({
      path: `/projects/${slug}`,
      title: "הפרויקט לא נמצא",
      description: "הפרויקט המבוקש אינו קיים.",
      indexable: false,
    });
  }

  return pageMetadata({
    path: `/projects/${project.slug}`,
    title: project.name,
    description: project.description,
  });
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetail project={project} />;
}

export const dynamicParams = false;
