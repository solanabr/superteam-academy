import { Star, Users, BookOpen, Award, Twitter, Linkedin, Globe } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface CourseInstructorProps {
	instructor: {
		name: string;
		title: string;
		avatar: string;
		bio: string;
		courses: number;
		students: number;
		rating: number;
		socialLinks: {
			twitter?: string;
			linkedin?: string;
			website?: string;
		};
	};
}

export function CourseInstructor({ instructor }: CourseInstructorProps) {
	const t = useTranslations("courses");

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold">{t("instructor.aboutTitle")}</h2>

			<Card>
				<CardHeader>
					<div className="flex items-start gap-4">
						<Avatar className="h-20 w-20">
							<AvatarImage src={instructor.avatar} alt={instructor.name} />
							<AvatarFallback className="text-lg">
								{instructor.name
									.split(" ")
									.map((n) => n[0])
									.join("")}
							</AvatarFallback>
						</Avatar>

						<div className="flex-1 space-y-2">
							<div>
								<CardTitle className="text-xl">{instructor.name}</CardTitle>
								<p className="text-muted-foreground">{instructor.title}</p>
							</div>

							<div className="flex items-center gap-6 flex-wrap">
								<div className="flex items-center gap-2">
									<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
									<span className="font-medium">{instructor.rating}</span>
									<span className="text-sm text-muted-foreground">
										{t("instructor.instructorRating")}
									</span>
								</div>

								<div className="flex items-center gap-2">
									<BookOpen className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">{instructor.courses}</span>
									<span className="text-sm text-muted-foreground">
										{t("instructor.courses")}
									</span>
								</div>

								<div className="flex items-center gap-2">
									<Users className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">
										{instructor.students.toLocaleString()}
									</span>
									<span className="text-sm text-muted-foreground">
										{t("instructor.students")}
									</span>
								</div>
							</div>

							<div className="flex items-center gap-2">
								{instructor.socialLinks.twitter && (
									<Button variant="outline" size="sm" asChild={true}>
										<a
											href={`https://twitter.com/${instructor.socialLinks.twitter}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Twitter className="h-4 w-4" />
										</a>
									</Button>
								)}
								{instructor.socialLinks.linkedin && (
									<Button variant="outline" size="sm" asChild={true}>
										<a
											href={`https://linkedin.com/in/${instructor.socialLinks.linkedin}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Linkedin className="h-4 w-4" />
										</a>
									</Button>
								)}
								{instructor.socialLinks.website && (
									<Button variant="outline" size="sm" asChild={true}>
										<a
											href={instructor.socialLinks.website}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Globe className="h-4 w-4" />
										</a>
									</Button>
								)}
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-4">
					<div>
						<h3 className="font-semibold mb-2">{t("instructor.about")}</h3>
						<p className="text-muted-foreground leading-relaxed">{instructor.bio}</p>
					</div>

					<Separator />

					<div>
						<h3 className="font-semibold mb-3">{t("instructor.instructorStats")}</h3>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="text-center p-3 bg-muted/50 rounded-lg">
								<div className="text-2xl font-bold text-primary">
									{instructor.courses}
								</div>
								<div className="text-sm text-muted-foreground">
									{t("instructor.coursesCreated")}
								</div>
							</div>
							<div className="text-center p-3 bg-muted/50 rounded-lg">
								<div className="text-2xl font-bold text-primary">
									{instructor.students.toLocaleString()}
								</div>
								<div className="text-sm text-muted-foreground">
									{t("instructor.studentsTaught")}
								</div>
							</div>
							<div className="text-center p-3 bg-muted/50 rounded-lg">
								<div className="text-2xl font-bold text-primary">
									{instructor.rating}
								</div>
								<div className="text-sm text-muted-foreground">
									{t("instructor.averageRating")}
								</div>
							</div>
							<div className="text-center p-3 bg-muted/50 rounded-lg">
								<Award className="h-8 w-8 text-primary mx-auto mb-1" />
								<div className="text-sm text-muted-foreground">
									{t("instructor.topInstructor")}
								</div>
							</div>
						</div>
					</div>

					<Separator />

					<div>
						<h3 className="font-semibold mb-3">
							{t("instructor.otherCourses", { name: instructor.name.split(" ")[0] })}
						</h3>
						<div className="space-y-3">
							<div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
								<div className="w-12 h-12 bg-muted rounded shrink-0" />
								<div className="flex-1 min-w-0">
									<h4 className="font-medium truncate">
										Advanced DeFi Strategies
									</h4>
									<p className="text-sm text-muted-foreground">
										4.9 • 2,340 students
									</p>
								</div>
								<Button variant="outline" size="sm">
									{t("instructor.viewCourse")}
								</Button>
							</div>

							<div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
								<div className="w-12 h-12 bg-muted rounded shrink-0" />
								<div className="flex-1 min-w-0">
									<h4 className="font-medium truncate">
										Smart Contract Security
									</h4>
									<p className="text-sm text-muted-foreground">
										4.8 • 1,890 students
									</p>
								</div>
								<Button variant="outline" size="sm">
									{t("instructor.viewCourse")}
								</Button>
							</div>
						</div>

						<div className="mt-4">
							<Button variant="outline" className="w-full">
								{t("instructor.viewAllCourses", {
									name: instructor.name.split(" ")[0],
								})}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
