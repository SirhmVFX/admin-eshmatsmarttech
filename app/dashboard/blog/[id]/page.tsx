'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { blogApi, BlogPost } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import BlogPostForm from '@/components/BlogPostForm';

export default function EditBlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => { blogApi.getOne(id).then(setPost); }, [id]);

  const handleSave = async (data: Omit<BlogPost, 'id'>) => {
    setSaving(true);
    try {
      await blogApi.update(id, data);
      showToast('Post updated!', 'success');
      router.push('/dashboard/blog');
    } catch { showToast('Failed to update post', 'error'); }
    finally { setSaving(false); }
  };

  if (!post) return <div style={{ padding: 40, color: 'var(--muted)', fontSize: 13 }}>Loading...</div>;

  return (
    <div>
      <div className="section-header">
        <div>
          <Link href="/dashboard/blog" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>← Blog</Link>
          <h1 className="section-title" style={{ marginTop: 4 }}>Edit: {post.title}</h1>
        </div>
      </div>
      <div className="card" style={{ padding: 22 }}>
        <BlogPostForm initial={post} onSave={handleSave} saving={saving} />
      </div>
    </div>
  );
}
