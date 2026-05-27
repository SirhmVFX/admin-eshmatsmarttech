'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { blogApi, BlogPost } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await blogApi.getAll();
    data.sort((a, b) => ((b.createdAt as any)?.seconds ?? 0) - ((a.createdAt as any)?.seconds ?? 0));
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.author.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await blogApi.delete(deleteTarget.id);
    showToast('Post deleted', 'success');
    setDeleteTarget(null);
    load();
  };

  const handleTogglePublish = async (post: BlogPost) => {
    if (!post.id) return;
    await blogApi.update(post.id, { isPublished: !post.isPublished });
    showToast(`Post ${post.isPublished ? 'unpublished' : 'published'}`, 'success');
    load();
  };

  const handleToggleFeatured = async (post: BlogPost) => {
    if (!post.id) return;
    await blogApi.update(post.id, { isFeatured: !post.isFeatured });
    showToast(`Post ${post.isFeatured ? 'unfeatured' : 'featured'}`, 'success');
    load();
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Blog / CMS</h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{posts.length} posts · {posts.filter(p => p.isPublished).length} published</p>
        </div>
        <Link href="/dashboard/blog/new">
          <button className="btn btn-primary btn-sm">+ New Post</button>
        </Link>
      </div>

      <div className="card">
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
          <input className="adm-input" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            {posts.length === 0 ? 'No blog posts yet. Click "+ New Post" to create your first.' : 'No posts match your search.'}
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr><th>Post</th><th>Category</th><th>Author</th><th>Read Time</th><th>Published</th><th>Featured</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(post => (
                <tr key={post.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {post.coverImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.coverImage} alt="" style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{post.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{post.excerpt?.slice(0, 60)}...</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-gold">{post.category}</span></td>
                  <td style={{ fontSize: 12 }}>{post.author}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{post.readTime} min</td>
                  <td>
                    <button onClick={() => handleTogglePublish(post)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: post.isPublished ? 'var(--green)' : 'var(--subtle)' }}>
                      {post.isPublished ? '●' : '○'}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleToggleFeatured(post)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: post.isFeatured ? 'var(--gold)' : 'var(--subtle)' }}>
                      {post.isFeatured ? '★' : '☆'}
                    </button>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {post.publishedAt || (post.createdAt ? new Date((post.createdAt as any).seconds * 1000).toLocaleDateString() : '—')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/dashboard/blog/${post.id}`}>
                        <button className="btn btn-ghost btn-sm">Edit</button>
                      </Link>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(post)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal
          message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
