import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaAws, FaJava } from "react-icons/fa6";
import { VscAzure } from "react-icons/vsc";
import {
  SiAngular,
  SiApachekafka,
  SiDocker,
  SiFirebase,
  SiFlutter,
  SiGit,
  SiJavascript,
  SiKotlin,
  SiKubernetes,
  SiMongodb,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiNginx,
  SiPostgresql,
  SiPython,
  SiRabbitmq,
  SiReact,
  SiRedis,
  SiRuby,
  SiRust,
  SiSupabase,
  SiSwift,
  SiTypescript,
  SiVuedotjs
} from "react-icons/si";

const highlights = [
  {
    label: "Systems",
    text: "Architecture, backend flow, and product structure."
  },
  {
    label: "Writing",
    text: "Readable long-form posts with calm pacing."
  },
  {
    label: "Craft",
    text: "Taste, discipline, and the details behind good work."
  }
];

const logoRows = [
  [
    { icon: SiJavascript, color: "#f7df1e", label: "JavaScript" },
    { icon: SiTypescript, color: "#3178c6", label: "TypeScript" },
    { icon: SiPython, color: "#3776ab", label: "Python" },
    { icon: FaJava, color: "#f89820", label: "Java" },
    { icon: SiRuby, color: "#cc342d", label: "Ruby" }
  ],
  [
    { icon: SiRust, color: "#000000", label: "Rust" },
    { icon: SiReact, color: "#61dafb", label: "React" },
    { icon: SiNextdotjs, color: "#111111", label: "Next.js" },
    { icon: SiVuedotjs, color: "#42b883", label: "Vue.js" }
  ],
  [
    { icon: SiAngular, color: "#dd0031", label: "Angular" },
    { icon: SiMongodb, color: "#47a248", label: "MongoDB" },
    { icon: SiDocker, color: "#2496ed", label: "Docker" },
    { icon: SiKubernetes, color: "#326ce5", label: "Kubernetes" }
  ],
  [
    { icon: SiPostgresql, color: "#4169e1", label: "PostgreSQL" },
    { icon: SiFirebase, color: "#ffca28", label: "Firebase" },
    { icon: SiSupabase, color: "#3ecf8e", label: "Supabase" },
    { icon: FaAws, color: "#ff9900", label: "AWS" }
  ],
  [
    { icon: VscAzure, color: "#0078d4", label: "Azure" },
    { icon: SiNginx, color: "#009639", label: "Nginx" },
    { icon: SiGit, color: "#f05032", label: "Git" },
    { icon: SiFlutter, color: "#02569b", label: "Flutter" }
  ],
  [
    { icon: SiReact, color: "#61dafb", label: "React Native" },
    { icon: SiSwift, color: "#f05138", label: "Swift" },
    { icon: SiKotlin, color: "#7f52ff", label: "Kotlin" },
    { icon: SiApachekafka, color: "#111111", label: "Kafka" },
    { icon: SiRabbitmq, color: "#ff6600", label: "RabbitMQ" },
    { icon: SiMysql, color: "#4479a1", label: "MySQL" },
    { icon: SiNodedotjs, color: "#5fa04e", label: "Node.js" }
  ]
];

const Home = () => {
  const desktopRows = logoRows;
  const mobileRows = logoRows.slice(0, 4);
  const [profileCardOpen, setProfileCardOpen] = useState(false);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-profile-trigger]")) {
        setProfileCardOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <main className="relative overflow-hidden bg-[linear-gradient(180deg,#fbfaf7_0%,#f6efe4_55%,#fbfaf7_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-12 h-72 w-72 rounded-full bg-[#eadfcd] blur-3xl" />
        <div className="absolute right-[-10rem] top-24 h-96 w-96 rounded-full bg-[#dfe8f6] blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-[#efe0ca] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(120,104,82,0.18),transparent)]" />
      </div>

      <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-10 px-4 pb-8 pt-12 md:grid-cols-[1.2fr_0.8fr] md:items-center md:px-6">
        <div>
          <h1 className="mt-5 max-w-4xl text-5xl leading-[0.98] tracking-[-0.04em] text-[#111111] md:text-7xl">
            Thoughtful writing for people who build with care.
          </h1>
          <p className="font-jakarta mt-7 max-w-2xl text-lg leading-8 text-[#494949] md:text-xl">
            Build • Reflect • Refine
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/read"
              className="font-jakarta inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#202020]"
            >
              Explore Articles
            </Link>
          </div>

        </div>

        <aside className="relative overflow-hidden px-0 py-6">
          <style>
            {`
              @keyframes ccStackRight {
                from { transform: translateX(-33.333%); }
                to { transform: translateX(0%); }
              }
              @keyframes ccStackLeft {
                from { transform: translateX(0%); }
                to { transform: translateX(-33.333%); }
              }
            `}
          </style>
          <div className="space-y-4">
            <div className="space-y-4 md:hidden">
              {mobileRows.map((row, index) => (
                <div key={`mobile-logo-row-${index}`} className="overflow-hidden">
                  <div
                    className="flex min-w-max gap-4 px-4"
                    style={{
                      animation: `${index % 2 === 0 ? "ccStackRight" : "ccStackLeft"} ${18 + index * 2}s linear infinite`
                    }}
                  >
                    {[...row, ...row, ...row, ...row, ...row, ...row].map((item, itemIndex) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={`${item.label}-mobile-${index}-${itemIndex}`}
                          aria-label={item.label}
                          title={item.label}
                          className="flex h-16 w-16 shrink-0 items-center justify-center"
                        >
                          <Icon className="h-8 w-8" style={{ color: item.color }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden space-y-4 md:block">
              {desktopRows.map((row, index) => (
              <div key={`logo-row-${index}`} className="overflow-hidden">
                <div
                  className="flex min-w-max gap-4 px-4"
                  style={{
                    animation: `${index % 2 === 0 ? "ccStackRight" : "ccStackLeft"} ${18 + index * 2}s linear infinite`
                  }}
                >
                  {[...row, ...row, ...row, ...row, ...row, ...row].map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={`${item.label}-${index}-${itemIndex}`}
                        aria-label={item.label}
                        title={item.label}
                        className="flex h-16 w-16 shrink-0 items-center justify-center"
                      >
                        <Icon className="h-8 w-8" style={{ color: item.color }} />
                      </div>
                    );
                  })}
                </div>
              </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="relative h-16">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(120,104,82,0.28),transparent)]" />
          <div
            data-profile-trigger
            className="group absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className={`absolute bottom-[calc(100%+0.9rem)] left-1/2 z-20 w-[min(31rem,calc(100vw-2rem))] -translate-x-1/2 transition duration-200 md:pointer-events-none ${profileCardOpen ? "opacity-100" : "pointer-events-none opacity-0"} md:opacity-0 md:group-hover:opacity-100`}>
              <div className="relative flex min-h-[18rem] items-center justify-center bg-white px-10 py-8 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                <div className="max-w-[20rem]">
                  <h3 className="font-jakarta text-2xl font-bold tracking-tight text-[#111111]">
                    Hey there. 👋
                  </h3>
                  <p className="font-jakarta mt-3 text-sm leading-7 text-[#4b5563]">
                    I’m Shefin. I work on software and spend time thinking about systems, design, and clarity. I like reading, collecting ideas, and writing when something feels worth sharing.
                  </p>
                </div>
                <div className="absolute left-1/2 top-full h-8 w-8 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setProfileCardOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-transparent shadow-[0_0_18px_rgba(0,0,0,0.08)]"
            >
              <img
                src="/images/profile.webp"
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
