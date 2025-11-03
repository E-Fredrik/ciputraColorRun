import Image from "next/image";

export default function Home() {
  return (
    <main className = "flex bg-white">
      <div className="m-auto">
        <Image
          src="/images/logo.png"
          alt="Ciputra Color Run Logo"
          width={300}
          height={300}
          className="object-contain"
        />
      </div>
    </main>
  );
}
