'use server'

import { createServerClient } from '@/lib/supabase/server'
import { Memo, MemoFormData } from '@/types/memo'
import { revalidatePath } from 'next/cache'

export async function getMemos(): Promise<Memo[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch memos:', error)
    throw new Error('메모를 불러오는데 실패했습니다.')
  }

  return (data || []).map(memo => ({
    id: memo.id,
    title: memo.title,
    content: memo.content,
    category: memo.category,
    tags: memo.tags || [],
    summary: memo.summary,
    createdAt: memo.created_at,
    updatedAt: memo.updated_at,
  }))
}

export async function getMemoById(id: string): Promise<Memo | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Failed to fetch memo:', error)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags || [],
    summary: data.summary,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function createMemo(formData: MemoFormData): Promise<Memo> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('memos')
    .insert({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create memo:', error)
    throw new Error('메모 생성에 실패했습니다.')
  }

  revalidatePath('/')

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags || [],
    summary: data.summary,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function updateMemo(
  id: string,
  formData: MemoFormData
): Promise<Memo> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('memos')
    .update({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update memo:', error)
    throw new Error('메모 수정에 실패했습니다.')
  }

  revalidatePath('/')

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags || [],
    summary: data.summary,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function deleteMemo(id: string): Promise<void> {
  const supabase = createServerClient()

  const { error } = await supabase.from('memos').delete().eq('id', id)

  if (error) {
    console.error('Failed to delete memo:', error)
    throw new Error('메모 삭제에 실패했습니다.')
  }

  revalidatePath('/')
}

export async function searchMemos(query: string): Promise<Memo[]> {
  const supabase = createServerClient()

  // PostgreSQL에서 배열 필터링과 텍스트 검색을 조합
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to search memos:', error)
    throw new Error('메모 검색에 실패했습니다.')
  }

  return (data || []).map(memo => ({
    id: memo.id,
    title: memo.title,
    content: memo.content,
    category: memo.category,
    tags: memo.tags || [],
    summary: memo.summary,
    createdAt: memo.created_at,
    updatedAt: memo.updated_at,
  }))
}
