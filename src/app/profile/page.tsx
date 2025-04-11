"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import AddFamilyMemberModal from "@/components/AddFamilyMemberModal"
import AddCameraModal from "@/components/AddCameraModal"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, UserPlus, PlusCircle, Camera } from "lucide-react"

interface ICamera {
  id: string
  name: string
}

interface FamilyMember {
  id: string
  name: string
  email: string
  emotion: string
  userId: string
}

interface User {
  id: string
  email: string
  userName: string | null
  password: string
  family: FamilyMember[]
  cameras: ICamera[]
}

export default function Profile() {
  const { data: session } = useSession()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentUserData = async () => {
    if (!session?.user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/users/${session.user.id}`)

      if (!response.ok) {
        throw new Error("Failed to fetch user data")
      }

      const userData = await response.json()
      setCurrentUser(userData)
    } catch (err) {
      console.error("Error fetching user data:", err)
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchCurrentUserData()
    }
  }, [session])

  const handleAddFamilyMember = () => {
    if (!session?.user?.id) return
    setIsModalOpen(true)
  }

  const handleAddCamera = () => {
    if (!session?.user?.id) return
    setIsCameraModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleCameraModalClose = () => {
    setIsCameraModalOpen(false)
  }

  const handleFamilyMemberAdded = () => {
    fetchCurrentUserData()
    handleModalClose()
  }

  const handleCameraAdded = () => {
    fetchCurrentUserData()
    handleCameraModalClose()
  }

  // Helper function to get emotion color
  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case "happy":
        return "bg-green-100 text-green-800 border-green-200"
      case "neutral":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "sad":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "angry":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please sign in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    )
  } 
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={`https://api.dicebear.com/7.x/micah/svg?seed=${session?.user?.name || "user"}`} />
                <AvatarFallback>{session?.user?.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{session?.user?.name || "User"}'s Profile</CardTitle>
                <CardDescription>{session?.user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="family" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="family">Family Members</TabsTrigger>
            <TabsTrigger value="cameras">Cameras</TabsTrigger>
          </TabsList>

          <TabsContent value="family">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Family Members</CardTitle>
                <Button onClick={handleAddFamilyMember}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </CardHeader>
              <CardContent>
                {currentUser && currentUser.family && currentUser.family.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {currentUser.family.map((familyMember) => (
                      <Card key={familyMember.id} className="overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center text-center gap-3">
                            <Avatar className="h-16 w-16">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/micah/svg?seed=${familyMember.name}`}
                                alt={familyMember.name}
                              />
                              <AvatarFallback>{familyMember.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium text-lg">{familyMember.name}</h3>
                              <p className="text-sm text-muted-foreground">{familyMember.email}</p>
                            </div>
                            <Badge className={`mt-2 ${getEmotionColor(familyMember.emotion)}`}>
                              {familyMember.emotion}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/50 rounded-lg">
                    <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No family members added yet.</p>
                    <Button variant="outline" className="mt-4" onClick={handleAddFamilyMember}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Family Member
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cameras">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Cameras</CardTitle>
                <Button onClick={handleAddCamera}>
                  <Camera className="h-4 w-4 mr-2" />
                  Add Camera
                </Button>
              </CardHeader>
              <CardContent>
                {currentUser?.cameras && currentUser.cameras.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {currentUser.cameras.map((camera) => (
                      <Card key={camera.id} className="overflow-hidden">
                        <div className="bg-muted h-32 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium">{camera.name}</h3>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/50 rounded-lg">
                    <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No cameras added yet.</p>
                    <Button variant="outline" className="mt-4" onClick={handleAddCamera}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Camera
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {isModalOpen && session?.user?.id && (
        <AddFamilyMemberModal onClose={handleModalClose} onAdded={handleFamilyMemberAdded} />
      )}

      {isCameraModalOpen && session?.user?.id && (
        <AddCameraModal userId={session.user.id} onClose={handleCameraModalClose} onAdded={handleCameraAdded} />
      )}
    </div>
  )
}
