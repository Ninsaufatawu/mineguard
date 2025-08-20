"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from '@supabase/supabase-js';
import { 
  Upload, 
  Trash2, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Shield,
  Camera,
  Edit
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  department?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  login_count: number;
  permissions: Record<string, any>;
  settings: Record<string, any>;
}

const Account: React.FC = () => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadAdminUser();
  }, []);

  const loadAdminUser = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) {
        setMessage({ type: 'error', text: 'No admin session found. Please login again.' });
        return;
      }

      const tokenPayload = JSON.parse(atob(adminToken.split('.')[1]));
      const userId = tokenPayload.userId;

      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading admin user:', error);
        setMessage({ type: 'error', text: 'Failed to load user data.' });
        return;
      }

      setAdminUser(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        department: data.department || ''
      });
    } catch (error) {
      console.error('Error loading admin user:', error);
      setMessage({ type: 'error', text: 'Failed to load user data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!adminUser) return;
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/admin/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: adminUser.id, ...formData })
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', text: result.error || 'Failed to save changes.' });
        return;
      }

      setAdminUser(result.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !adminUser) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB.' });
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${adminUser.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('admin-profiles')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        setMessage({ type: 'error', text: 'Failed to upload image.' });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('admin-profiles')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ profile_image_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', adminUser.id);

      if (updateError) {
        setMessage({ type: 'error', text: 'Failed to update profile image.' });
        return;
      }

      setAdminUser(prev => prev ? { ...prev, profile_image_url: publicUrl } : null);
      setMessage({ type: 'success', text: 'Profile image updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload image.' });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'moderator': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading account information...</span>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load account information. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-start">
        <div className="flex-shrink-0 relative">
          <Avatar className="h-20 w-20">
            <AvatarImage 
              src={adminUser.profile_image_url} 
              alt={adminUser.name}
              className="object-cover"
            />
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(adminUser.name)}
            </AvatarFallback>
          </Avatar>
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>
        <div className="ml-6">
          <h3 className="text-xl font-semibold text-gray-900">{adminUser.name}</h3>
          <p className="text-gray-600">{adminUser.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getRoleBadgeColor(adminUser.role)}>
              <Shield className="h-3 w-3 mr-1" />
              {adminUser.role.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={adminUser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {adminUser.status.toUpperCase()}
            </Badge>
          </div>
          <div className="flex gap-2 mt-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              Change Photo
            </Button>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Full Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1"
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1"
              placeholder="Enter your email address"
            />
          </div>
          
          <div>
            <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="mt-1"
              placeholder="Enter your phone number"
            />
          </div>
          
          <div>
            <Label htmlFor="department" className="flex items-center gap-2 text-sm font-medium">
              <Building className="h-4 w-4" />
              Department
            </Label>
            <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
              <SelectTrigger id="department" className="mt-1">
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IT & Systems">IT & Systems</SelectItem>
                <SelectItem value="Enforcement">Enforcement</SelectItem>
                <SelectItem value="Licensing">Licensing</SelectItem>
                <SelectItem value="Monitoring">Monitoring</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>
            Overview of your account activity and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{adminUser.login_count}</div>
              <div className="text-sm text-blue-800">Total Logins</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {adminUser.last_login ? new Date(adminUser.last_login).toLocaleDateString() : 'Never'}
              </div>
              <div className="text-sm text-green-800">Last Login</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {new Date(adminUser.created_at).toLocaleDateString()}
              </div>
              <div className="text-sm text-purple-800">Account Created</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Security & Account Actions</CardTitle>
          <CardDescription>
            Manage account security and access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium text-yellow-800">Change Password</p>
                <p className="text-sm text-yellow-600">Update your account password for better security</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                onClick={() => window.location.href = '/admin/forgot-password'}
              >
                Change Password
              </Button>
            </div>
            
            {adminUser.role !== 'super_admin' && (
              <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-800">Account Support</p>
                  <p className="text-sm text-red-600">Need help with your account? Contact the super administrator</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-100"
                  onClick={() => window.location.href = '/admin/login'}
                >
                  Contact Support
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Account; 