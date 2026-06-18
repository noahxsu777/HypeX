import TopBar from '@/components/layout/TopBar';
import ExploreContent from '@/components/explore/ExploreContent';

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar showSearch />
      <div className="pt-14">
        <ExploreContent />
      </div>
    </div>
  );
}
