import { storage } from "./storage";

async function seed() {
  console.log("Seeding database...");

  try {
    const student = await storage.createUser({
      name: "Olabisi Abiodun",
      matricNumber: "18/52HA019",
      staffId: null,
      email: "olabisi@student.unilorin.edu.ng",
      password: "password",
      role: "student",
      department: "Computer Science",
    });
    console.log("✓ Created student:", student.matricNumber);

    const lecturer = await storage.createUser({
      name: "Dr. Adebayo",
      matricNumber: null,
      staffId: "UNI/L/001",
      email: "adebayo@unilorin.edu.ng",
      password: "password",
      role: "lecturer",
      department: "Computer Science",
    });
    console.log("✓ Created lecturer:", lecturer.staffId);

    const course1 = await storage.createCourse({
      code: "GNS 312",
      title: "Digital Entrepreneurship",
      lecturerId: lecturer.id,
      department: "General Studies",
      capacity: 200,
    });
    console.log("✓ Created course:", course1.code);

    const course2 = await storage.createCourse({
      code: "CSC 301",
      title: "Data Structures",
      lecturerId: lecturer.id,
      department: "Computer Science",
      capacity: 85,
    });
    console.log("✓ Created course:", course2.code);

    const course3 = await storage.createCourse({
      code: "CSC 401",
      title: "Software Engineering II",
      lecturerId: lecturer.id,
      department: "Computer Science",
      capacity: 85,
    });
    console.log("✓ Created course:", course3.code);

    const session = await storage.createSession({
      courseId: course1.id,
      location: "Lecture Theatre A",
      latitude: "8.4799",
      longitude: "4.5418",
      geofenceRadius: 100,
      startTime: new Date(),
      isActive: true,
    });
    console.log("✓ Created active session for:", course1.code);

    console.log("\n✅ Database seeded successfully!");
    console.log("\nDemo Credentials:");
    console.log("Student: 18/52HA019 / password");
    console.log("Lecturer: UNI/L/001 / password");
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
