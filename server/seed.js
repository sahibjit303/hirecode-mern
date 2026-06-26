import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Candidate from "./models/Candidate.js";

dotenv.config();

const DEMO_USER = {
  name: "Demo User",
  email: "demo@CodeHire.live",
  password: "demo1234",
  company: "CodeHire Demo",
  role: "founder",
};

const demoCandidates = [
  { name: "Arjun Kapoor", role: "Senior Backend Engineer", stack: ["Go", "Kubernetes", "Postgres"], score: 92, stage: "interview", flags: { pasteEvents: 0, editPattern: "organic" } },
  { name: "Sofia Ruiz", role: "Full Stack Engineer", stack: ["React", "Node", "TypeScript"], score: 87, stage: "assess", flags: { pasteEvents: 1, editPattern: "organic" } },
  { name: "Marcus Lee", role: "Systems Engineer", stack: ["Rust", "Distributed Systems"], score: 81, stage: "screen", flags: { pasteEvents: 0, editPattern: "organic" } },
  { name: "Priya Nair", role: "ML Engineer", stack: ["Python", "PyTorch", "MLOps"], score: 78, stage: "screen", flags: { pasteEvents: 3, editPattern: "suspicious" } },
  { name: "Daniel Kim", role: "Frontend Engineer", stack: ["React", "Next.js", "Tailwind"], score: 74, stage: "rejected", flags: { pasteEvents: 0, editPattern: "organic" } },
];

const run = async () => {
  await connectDB();

  // Upsert demo user
  let user = await User.findOne({ email: DEMO_USER.email });
  if (!user) {
    user = await User.create(DEMO_USER);
    console.log("Created demo user:", user.email);
  } else {
    console.log("Demo user already exists:", user.email);
  }

  // Seed candidates with owner
  await Candidate.deleteMany({ owner: user._id });
  const withOwner = demoCandidates.map((c) => ({ ...c, owner: user._id }));
  await Candidate.insertMany(withOwner);

  console.log("Seeded", demoCandidates.length, "candidates for", user.email);
  console.log("\n  Demo login:");
  console.log("  email:    demo@CodeHire.live");
  console.log("  password: demo1234\n");
  process.exit(0);
};

run();
