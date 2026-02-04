import "dotenv/config";
import { prisma } from "../lib/prisma.js";

const positionTitles = [
  "Senior Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Product Manager",
  "UX Designer",
  "UI Designer",
  "QA Engineer",
  "Security Engineer",
  "Cloud Architect",
  "Mobile Developer",
  "Database Administrator",
  "Business Analyst",
  "Project Manager",
  "Scrum Master",
  "Technical Writer",
  "Sales Engineer",
  "Marketing Manager",
  "Content Strategist",
  "HR Specialist",
  "Financial Analyst",
  "Operations Manager",
  "Customer Success Manager",
  "Account Executive",
  "Research Scientist",
  "Systems Administrator",
  "Network Engineer",
];

const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"];

const locations = [
  "New York, NY",
  "San Francisco, CA",
  "Los Angeles, CA",
  "Chicago, IL",
  "Boston, MA",
  "Seattle, WA",
  "Austin, TX",
  "Remote",
  "Hybrid - New York",
  "Hybrid - San Francisco",
];

const timezones = ["EST", "PST", "CST", "MST", "UTC"];

const companies = [
  "TechCorp",
  "InnovateLabs",
  "Digital Solutions",
  "CloudTech",
  "DataVault",
  "CodeForge",
  "DevWorks",
  "TechNova",
  "FutureSystems",
  "SmartTech",
];

const descriptions = [
  "We are looking for a talented professional to join our team. You will work on exciting projects and collaborate with a diverse group of experts.",
  "Join our innovative team and help build the next generation of products. We offer competitive compensation and excellent growth opportunities.",
  "This role offers the chance to work on cutting-edge technology and make a real impact. We value creativity, collaboration, and continuous learning.",
  "We're seeking a motivated individual who is passionate about technology and eager to contribute to our mission of innovation and excellence.",
  "This position offers an opportunity to work with industry-leading technologies and a team of talented professionals dedicated to excellence.",
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDateInFuture() {
  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + Math.floor(Math.random() * 90) + 30); // 30-120 days from now
  return future;
}

async function addPositions() {
  try {
    // Try to find department with ID "1" first, otherwise get the first department
    let department = await prisma.department.findUnique({
      where: { DepartmentId: "1" },
    });

    if (!department) {
      // If "1" doesn't exist, get the first department
      department = await prisma.department.findFirst({
        orderBy: { DepartmentName: "asc" },
      });

      if (!department) {
        console.error("No departments found in the database. Please create a department first.");
        process.exit(1);
      }

      console.log(`Department with ID '1' not found. Using first department: ${department.DepartmentName} (ID: ${department.DepartmentId})`);
    } else {
      console.log(`Found department: ${department.DepartmentName} (ID: ${department.DepartmentId})`);
    }

    console.log(`\nAdding 100 positions to department: ${department.DepartmentName} (ID: ${department.DepartmentId})...`);

    const positions = [];
    for (let i = 0; i < 100; i++) {
      const yearsRequired = Math.floor(Math.random() * 10) + 1; // 1-10 years
      const positionTitle = getRandomElement(positionTitles);
      const companyName = getRandomElement(companies);
      
      positions.push({
        PositionTitle: `${positionTitle} ${i + 1}`,
        CompanyName: companyName,
        PositionState: "OPEN",
        EmploymentType: getRandomElement(employmentTypes),
        YearsRequired: yearsRequired,
        Description: getRandomElement(descriptions),
        Timezone: getRandomElement(timezones),
        Deadline: getRandomDateInFuture(),
        PositionLocation: getRandomElement(locations),
        DepartmentId: department.DepartmentId,
      });
    }

    // Insert positions in batches for better performance
    const batchSize = 20;
    let inserted = 0;

    for (let i = 0; i < positions.length; i += batchSize) {
      const batch = positions.slice(i, i + batchSize);
      await prisma.position.createMany({
        data: batch,
        skipDuplicates: true,
      });
      inserted += batch.length;
      console.log(`Inserted ${inserted}/100 positions...`);
    }

    console.log(`\n✅ Successfully added ${inserted} positions to department: ${department.DepartmentName}`);
    
    // Verify the insertions
    const count = await prisma.position.count({
      where: { DepartmentId: department.DepartmentId },
    });
    console.log(`Total positions in department: ${count}`);
  } catch (error) {
    console.error("Error adding positions:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addPositions();
