import { GetStaticPaths, GetStaticProps } from 'next';
import Head from "next/head";
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Header from '../../components/Header';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  const postContentText = post.data.content.map(section => {
    return {
      heading: section.heading,
      body: RichText.asText(section.body)
    };
  });

  const postWords = postContentText.map((word) => {
    return (
      word.heading?.split(/\s/g).length + word.body?.split(/\s/g).length
    );
  });

  const postTotalWords = postWords.reduce((acc, curr) => acc + curr);

  const timeToRead = Math.ceil(postTotalWords / 200);

  return (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>

      <Header />

      <img className={styles.bannerImg} src={post.data.banner.url} alt="banner" />

      <main className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.postInfo}>
            <div>
              <FiCalendar /><span>{format(new Date(post.first_publication_date), "dd MMM yyyy", {locale: ptBR,})}</span>
            </div>
            <div>
              <FiUser /><span>{post.data.author}</span>
            </div>
            <div>
              <FiClock /><span>{timeToRead} min</span>
            </div>
          </div>
          { post.data.content.map(({ heading, body }) => (
            <div key={heading}>
              <h2>{heading}</h2>
              <div
                className={styles.postContent} 
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }} 
              />
            </div>
          )) }
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ],);

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }))

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post
    },

    revalidate: 60 * 60,
  };
};
