'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { blogApi, BlogPost } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import BlogPostForm from '@/components/BlogPostForm';

export default function NewBlogPostPage() {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSave = async (data: Omit<BlogPost, 'id'>) => {
    setSaving(true);
    try {
      await blogApi.create(data);
      showToast('Post created!', 'success');
      router.push('/dashboard/blog');
    } catch { showToast('Failed to save post', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <Link href="/dashboard/blog" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>← Blog</Link>
          <h1 className="section-title" style={{ marginTop: 4 }}>New Blog Post</h1>
        </div>
      </div>
      <div className="card" style={{ padding: 22 }}>
        <BlogPostForm onSave={handleSave} saving={saving} />
      </div>
    </div>
  );
}
