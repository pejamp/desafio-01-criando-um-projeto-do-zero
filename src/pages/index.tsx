import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from "next/head";
import Link from "next/link";

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { ExitPreviewButton } from '../components/ExitPreviewButton';
import { postFormating } from '../formatting/prismicResponseFormating.';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const [loadPosts, setLoadPosts] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  
  async function handleLoadPosts() {
    await fetch(nextPage ? nextPage : '')
      .then(response => response.json())
      .then(data => {
        const formattedData = postFormating(data);
        setLoadPosts([...loadPosts, ...formattedData.results]);
        setNextPage(formattedData.next_page);
      });
  }

  return (
    <>
      <Head>
        <title>Posts | Spacetraveling</title>
      </Head>

      <main className={commonStyles.container}>
        <div className={styles.posts}>
          <img src="/Logo.svg" alt="logo" />

          { postsPagination.results.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <div>
                    <FiCalendar /><span>{format(new Date(post.first_publication_date), "dd MMM yyyy", {locale: ptBR,})}</span>
                  </div>
                  <div>
                    <FiUser /><span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          )) }

          { loadPosts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <div>
                    <FiCalendar /><span>{post.first_publication_date}</span>
                  </div>
                  <div>
                    <FiUser /><span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          )) }
          
          { nextPage ? (
            <button
              type="button"
              onClick={handleLoadPosts}
            >
              Carregar mais posts
            </button>
          ) : (
            ''
          ) }

          {preview && (
            <ExitPreviewButton />
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    ref: previewData?.ref ?? null,
    fetch: [
      'posts.title', 
      'posts.subtitle', 
      'posts.author'
    ],
    pageSize: 1,
  });

  const posts = postsResponse.results.map(post => {

    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
      preview
    },
    revalidate: 60 * 60,
  }
};
