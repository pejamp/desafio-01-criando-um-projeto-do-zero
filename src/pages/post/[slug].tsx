import { GetStaticPaths, GetStaticProps } from 'next';
import Head from "next/head";
import { useRouter } from 'next/router';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Header from '../../components/Header';
import Comments from '../../components/Comments';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { ExitPreviewButton } from '../../components/ExitPreviewButton';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean;
  previousPost: {
    uid?: string;
    title?: string;
  };
  nextPost: {
    uid?: string;
    title?: string;
  };
}

export default function Post({ post, preview, previousPost, nextPost }: PostProps) {
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

  const postEdited = post.first_publication_date !== post.last_publication_date;
  let editedDate;

  if (postEdited) {
    editedDate = format(new Date(post.last_publication_date), "'* editado em' dd MMM yyyy', às' h':'m", {locale: ptBR,})
  }

  console.log(editedDate)

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
            {postEdited && (
              <span className={styles.editedDate}>{editedDate}</span>
            )}
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

          <div className={styles.navPosts}>
            {previousPost.uid ? (
              <Link href={`/post/${previousPost.uid}`}>
                <div>
                  <a>
                    {`${previousPost.title}`}
                  </a>
                  <strong>Post anterior</strong>
                </div>
              </Link>
            ) : (
              <a></a>
            )}

            {nextPost.uid ? (
              <Link href={`/post/${nextPost.uid}`}>
                <div className={styles.nextPost}>
                  <a>
                    {`${nextPost.title}`}
                  </a>
                  <strong>Próximo post</strong>
                </div>
              </Link>
            ) : (
              <a></a>
            )}
          </div>

          <Comments />
          {preview && (
            <ExitPreviewButton />
          )}
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

export const getStaticProps: GetStaticProps = async ({ 
  params, previewData, preview = false, 
}) => {
  const prismic = getPrismicClient();
  const { slug } = params;
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: response.data.banner,
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  const responsePreviousPost = (
    await prismic.query(
      Prismic.Predicates.dateBefore(
        'document.first_publication_date',
        response.first_publication_date
      ),
      { orderings: '[document.first_publication_date]' }
    )
  ).results.pop();

  const responseNextPost = (
    await prismic.query(
      Prismic.Predicates.dateAfter(
        'document.first_publication_date',
        response.first_publication_date
      ),
      { orderings: '[document.first_publication_date]' }
    )
  ).results[0];

  const previousPost = {
    uid: responsePreviousPost?.uid ? responsePreviousPost.uid : '',
    title: responsePreviousPost?.data.title ? responsePreviousPost.data.title : '',
  };

  const nextPost = {
    uid: responseNextPost?.uid ? responseNextPost.uid : '',
    title: responseNextPost?.data.title ? responseNextPost.data.title : '',
  };

  return {
    props: {
      post,
      preview,
      previousPost,
      nextPost,
    },

    revalidate: 60 * 60,
  };
};
