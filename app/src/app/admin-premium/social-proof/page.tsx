'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  MessageSquare,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Star,
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Testimonial {
  _id: string;
  name: string;
  role: string;
  avatar_url?: string;
  content: string;
  rating: number;
  is_active: boolean;
  order: number;
}

interface Partner {
  _id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  is_active: boolean;
  order: number;
}

export default function SocialProofAdminPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    role: '',
    avatar_url: '',
    content: '',
    rating: 5,
    is_active: true,
    order: 0,
  });
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    is_active: true,
    order: 0,
  });
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [testimonialsRes, partnersRes] = await Promise.all([
        fetch('/api/testimonials'),
        fetch('/api/partners'),
      ]);

      if (testimonialsRes.ok) {
        setTestimonials(await testimonialsRes.json());
      }
      if (partnersRes.ok) {
        setPartners(await partnersRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/newupload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return data.link;
      }
      return null;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    } finally {
      setUploading(false);
    }
  }

  // Testimonial CRUD
  async function saveTestimonial() {
    setSaving(true);
    try {
      const url = editingTestimonial
        ? `/api/testimonials/${editingTestimonial._id}`
        : '/api/testimonials';
      const method = editingTestimonial ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testimonialForm),
      });

      if (res.ok) {
        await fetchData();
        setTestimonialDialogOpen(false);
        resetTestimonialForm();
      }
    } catch (error) {
      console.error('Failed to save testimonial:', error);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTestimonial(id: string) {
    try {
      const res = await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to delete testimonial:', error);
    }
  }

  function resetTestimonialForm() {
    setTestimonialForm({
      name: '',
      role: '',
      avatar_url: '',
      content: '',
      rating: 5,
      is_active: true,
      order: 0,
    });
    setEditingTestimonial(null);
  }

  function openEditTestimonial(testimonial: Testimonial) {
    setEditingTestimonial(testimonial);
    setTestimonialForm({
      name: testimonial.name,
      role: testimonial.role,
      avatar_url: testimonial.avatar_url || '',
      content: testimonial.content,
      rating: testimonial.rating,
      is_active: testimonial.is_active,
      order: testimonial.order,
    });
    setTestimonialDialogOpen(true);
  }

  // Partner CRUD
  async function savePartner() {
    setSaving(true);
    try {
      const url = editingPartner ? `/api/partners/${editingPartner._id}` : '/api/partners';
      const method = editingPartner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerForm),
      });

      if (res.ok) {
        await fetchData();
        setPartnerDialogOpen(false);
        resetPartnerForm();
      }
    } catch (error) {
      console.error('Failed to save partner:', error);
    } finally {
      setSaving(false);
    }
  }

  async function deletePartner(id: string) {
    try {
      const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to delete partner:', error);
    }
  }

  function resetPartnerForm() {
    setPartnerForm({
      name: '',
      logo_url: '',
      website_url: '',
      is_active: true,
      order: 0,
    });
    setEditingPartner(null);
  }

  function openEditPartner(partner: Partner) {
    setEditingPartner(partner);
    setPartnerForm({
      name: partner.name,
      logo_url: partner.logo_url,
      website_url: partner.website_url || '',
      is_active: partner.is_active,
      order: partner.order,
    });
    setPartnerDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="container flex min-h-[400px] items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Link>
        </Button>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <MessageSquare className="text-primary h-7 w-7" />
          Social Proof Manager
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage testimonials and partner logos displayed on the landing page.
        </p>
      </div>

      <Tabs defaultValue="testimonials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="testimonials" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Testimonials ({testimonials.length})
          </TabsTrigger>
          <TabsTrigger value="partners" className="gap-2">
            <Building2 className="h-4 w-4" />
            Partners ({partners.length})
          </TabsTrigger>
        </TabsList>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Add testimonials from satisfied learners to build trust.
            </p>
            <Dialog open={testimonialDialogOpen} onOpenChange={setTestimonialDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetTestimonialForm();
                    setTestimonialDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Testimonial
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}
                  </DialogTitle>
                  <DialogDescription>Fill in the testimonial details below.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={testimonialForm.name}
                      onChange={(e) =>
                        setTestimonialForm({ ...testimonialForm, name: e.target.value })
                      }
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role *</Label>
                    <Input
                      id="role"
                      value={testimonialForm.role}
                      onChange={(e) =>
                        setTestimonialForm({ ...testimonialForm, role: e.target.value })
                      }
                      placeholder="Solana Developer"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="content">Testimonial Content *</Label>
                    <Textarea
                      id="content"
                      value={testimonialForm.content}
                      onChange={(e) =>
                        setTestimonialForm({ ...testimonialForm, content: e.target.value })
                      }
                      placeholder="Share their experience..."
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Avatar Image</Label>
                    <div className="flex items-center gap-4">
                      {testimonialForm.avatar_url && (
                        <Image
                          src={testimonialForm.avatar_url}
                          alt="Avatar preview"
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await uploadImage(file);
                            if (url) {
                              setTestimonialForm({ ...testimonialForm, avatar_url: url });
                            }
                          }
                        }}
                        disabled={uploading}
                      />
                      {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="rating">Rating (1-5)</Label>
                      <Input
                        id="rating"
                        type="number"
                        min={1}
                        max={5}
                        value={testimonialForm.rating}
                        onChange={(e) =>
                          setTestimonialForm({
                            ...testimonialForm,
                            rating: parseInt(e.target.value) || 5,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="order">Display Order</Label>
                      <Input
                        id="order"
                        type="number"
                        value={testimonialForm.order}
                        onChange={(e) =>
                          setTestimonialForm({
                            ...testimonialForm,
                            order: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={testimonialForm.is_active}
                      onCheckedChange={(checked) =>
                        setTestimonialForm({ ...testimonialForm, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Active (visible on landing page)</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTestimonialDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveTestimonial} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingTestimonial ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {testimonials.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="text-muted-foreground mb-4 h-12 w-12" />
                  <p className="text-muted-foreground">No testimonials yet. Add your first one!</p>
                </CardContent>
              </Card>
            ) : (
              testimonials.map((testimonial) => (
                <Card key={testimonial._id} className={!testimonial.is_active ? 'opacity-50' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {testimonial.avatar_url ? (
                          <Image
                            src={testimonial.avatar_url}
                            alt={testimonial.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">{testimonial.name}</CardTitle>
                          <CardDescription>{testimonial.role}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditTestimonial(testimonial)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete testimonial?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTestimonial(testimonial._id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Add partner logos to showcase your Web3 ecosystem connections.
            </p>
            <Dialog open={partnerDialogOpen} onOpenChange={setPartnerDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetPartnerForm();
                    setPartnerDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Partner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingPartner ? 'Edit Partner' : 'Add Partner'}</DialogTitle>
                  <DialogDescription>Fill in the partner details below.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="partner_name">Partner Name *</Label>
                    <Input
                      id="partner_name"
                      value={partnerForm.name}
                      onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                      placeholder="Solana Foundation"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Logo Image *</Label>
                    <div className="flex items-center gap-4">
                      {partnerForm.logo_url && (
                        <Image
                          src={partnerForm.logo_url}
                          alt="Logo preview"
                          width={100}
                          height={40}
                          className="h-10 w-auto object-contain"
                        />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await uploadImage(file);
                            if (url) {
                              setPartnerForm({ ...partnerForm, logo_url: url });
                            }
                          }
                        }}
                        disabled={uploading}
                      />
                      {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="website_url">Website URL (optional)</Label>
                    <Input
                      id="website_url"
                      value={partnerForm.website_url}
                      onChange={(e) =>
                        setPartnerForm({ ...partnerForm, website_url: e.target.value })
                      }
                      placeholder="https://solana.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="partner_order">Display Order</Label>
                    <Input
                      id="partner_order"
                      type="number"
                      value={partnerForm.order}
                      onChange={(e) =>
                        setPartnerForm({ ...partnerForm, order: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="partner_is_active"
                      checked={partnerForm.is_active}
                      onCheckedChange={(checked) =>
                        setPartnerForm({ ...partnerForm, is_active: checked })
                      }
                    />
                    <Label htmlFor="partner_is_active">Active (visible on landing page)</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPartnerDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={savePartner} disabled={saving || !partnerForm.logo_url}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingPartner ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {partners.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="text-muted-foreground mb-4 h-12 w-12" />
                  <p className="text-muted-foreground">No partners yet. Add your first one!</p>
                </CardContent>
              </Card>
            ) : (
              partners.map((partner) => (
                <Card key={partner._id} className={!partner.is_active ? 'opacity-50' : ''}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-muted flex h-16 w-24 items-center justify-center rounded-md p-2">
                        <Image
                          src={partner.logo_url}
                          alt={partner.name}
                          width={80}
                          height={40}
                          className="h-auto max-h-10 w-auto object-contain"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{partner.name}</p>
                        {partner.website_url && (
                          <a
                            href={partner.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground text-xs hover:underline"
                          >
                            {partner.website_url}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditPartner(partner)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete partner?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePartner(partner._id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
