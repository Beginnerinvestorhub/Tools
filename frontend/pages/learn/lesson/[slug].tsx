import { GetStaticPaths, GetStaticProps } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import LessonPlayer from '../../../components/education/LessonPlayer';
import Quiz from '../../../components/education/Quiz';
import GlossaryTooltip from '../../../components/education/GlossaryTooltip';
import modules from '../../../content/education/modules';

interface Props {
  mdxSource: MDXRemoteSerializeResult;
  frontMatter: { title: string; videoUrl: string };
  slug: string;
}

const components = {
  Quiz,
  GlossaryTooltip,
};

export default function Lesson({ mdxSource, frontMatter, slug }: Props) {
  return (
    <div className="prose max-w-3xl mx-auto px-4 py-8">
      <h1>{frontMatter.title}</h1>
      <LessonPlayer videoUrl={frontMatter.videoUrl} lessonSlug={slug} />
      <MDXRemote {...mdxSource} components={components} />
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = modules.flatMap((m) =>
    m.lessons.map((l) => ({ params: { slug: l.slug } }))
  );
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const filePath = path.join(process.cwd(), 'frontend', 'content', 'education', `${slug}.mdx`);
  const source = fs.readFileSync(filePath, 'utf8');
  const { content, data } = matter(source);
  const mdxSource = await serialize(content, { scope: data });

  return {
    props: {
      mdxSource,
      frontMatter: data,
      slug,
    },
  };
};
