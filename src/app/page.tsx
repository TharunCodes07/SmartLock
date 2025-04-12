"use client"

import { useState } from "react"
import CameraView from "@/components/Camera"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useQuery } from '@tanstack/react-query'

// Interface for Camera
interface Camera {
  id: string
  name: string
  status: string
}

// Interface for Family
interface Family {
  id: string
  name: string
  emotion: string
  email: string
}

export default function CamerasPage() {
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)

  // Fetch cameras with TanStack Query
  const { data: cameras, isLoading: loadingCameras, error: camerasError } = useQuery({
    queryKey: ['cameras'],
    queryFn: async () => {
      const response = await fetch("/api/cameras", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/auth/login"
          throw new Error("Unauthorized. Please log in.")
        }
        throw new Error("Failed to fetch cameras")
      }
      return response.json()
    },
    refetchInterval: 1200000 // Refetch every 1 minute
  })

  // Fetch family members with TanStack Query
  const { data: familyMembers, isLoading: familyLoading, error: familyError } = useQuery({
    queryKey: ['family'],
    queryFn: async () => {
      const response = await fetch("/api/family", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login"
          throw new Error("Unauthorized. Please log in.")
        }
        throw new Error("Failed to fetch family members")
      }
      return response.json()
    },
    refetchInterval: 1200000 // Refetch every 1 minute
  })

  // Helper function for emotion colors
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

  // Helper function for status colors
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "LOCKED":
        return "bg-red-100 text-red-800 border-red-200"
      case "UNLOCKED":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Render loading state for cameras
  if (loadingCameras) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Render error state for cameras
  if (camerasError) {
    return (
      <Card className="mx-auto max-w-md mt-8">
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>{(camerasError as Error).message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="cameras" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="cameras">Cameras</TabsTrigger>
          <TabsTrigger value="family">Family Members</TabsTrigger>
        </TabsList>

        <TabsContent value="cameras">
          <Card>
            <CardHeader>
              <CardTitle>Your Cameras</CardTitle>
            </CardHeader>
            <CardContent>
              {cameras.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You have no cameras added yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {cameras.map((camera: Camera) => (
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{camera.name}</h3>
                            <Badge className={getStatusColor(camera.status)}>
                              {camera.status.charAt(0).toUpperCase() + camera.status.slice(1).toLowerCase()}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCameraId(camera.name)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="family">
          <Card>
            <CardHeader>
              <CardTitle>Your Family Members</CardTitle>
            </CardHeader>
            <CardContent>
              {familyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : familyError ? (
                <div className="text-center py-8 text-destructive">
                  <p>{(familyError as Error).message}</p>
                </div>
              ) : familyMembers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You have no family members added yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {familyMembers.map((family: Family) => (
                    <Card key={family.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center gap-3">
                          <Avatar className="h-16 w-16">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/micah/svg?seed=${family.name}`}
                              alt={family.name}
                            />
                            <AvatarFallback>{family.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-lg">{family.name}</h3>
                            <p className="text-sm text-muted-foreground">{family.email}</p>
                          </div>
                          <Badge className={`mt-2 ${getEmotionColor(family.emotion)}`}>
                            {family.emotion}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Camera View */}
      {selectedCameraId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Camera: {selectedCameraId}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedCameraId(null)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </CardHeader>
            <CardContent>
              <CameraView cameraId={selectedCameraId} onClose={() => setSelectedCameraId(null)} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}