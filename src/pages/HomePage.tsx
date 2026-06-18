import TopBar from '../components/layout/TopBar';
import StoriesBar from '../components/home/StoriesBar';
import PostCard from '../components/home/PostCard';
import { useStore } from '../store/useStore';

export default function HomePage() {
  const { posts } = useStore();

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar />
      <div className="pt-14">
        <StoriesBar />
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <div className="h-20" />
      </div>
    </div>
  );
}
