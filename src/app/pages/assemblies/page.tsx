// app/page.tsx or pages/index.tsx
import React from "react";
import Card2 from "@/components/AssemblyLeft";
import Card1 from "@/components/AssemblyRight";

const HomePage = () => {
  return (
    <div className="flex min-h-screen min-w-screen box-border p-4 gap-4 bg-gray-100">
      <Card1 />
      <Card2 />
    </div>
  );
};

export default HomePage;
