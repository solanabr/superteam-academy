import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User, Challenge } from '@/models';
import { logAction } from '@/lib/services/audit-log.service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const admin = await User.findById(session.user.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || 'all';
    const category = searchParams.get('category') || 'all';

    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    if (category !== 'all') {
      query.category = category;
    }

    const total = await Challenge.countDocuments(query);
    const challenges = await Challenge.find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const categories = await Challenge.distinct('category');
    const difficulties = ['easy', 'medium', 'hard'];

    const stats = {
      total: await Challenge.countDocuments(),
      active: await Challenge.countDocuments({ is_active: true }),
      inactive: await Challenge.countDocuments({ is_active: false }),
    };

    return NextResponse.json({
      challenges,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        categories,
        difficulties,
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const admin = await User.findById(session.user.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      title,
      description,
      prompt,
      difficulty,
      category,
      xpReward,
      timeEstimate,
      language,
      starterCode,
      solutionCode,
      testCases,
      functionName,
      hints,
      tags,
    } = await request.json();

    // Validation
    if (!title || !description || !prompt || !difficulty || !category) {
      return NextResponse.json(
        { error: 'Title, description, prompt, difficulty, and category are required' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json({ error: 'Title must be 200 characters or less' }, { status: 400 });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const challenge = await Challenge.create({
      id: `challenge-${Date.now()}`,
      slug,
      title,
      description,
      prompt,
      difficulty,
      category,
      xp_reward: xpReward || 50,
      time_estimate: timeEstimate || 15,
      language: language || 'typescript',
      starter_code: starterCode || '',
      solution_code: solutionCode || '',
      test_cases: testCases || [],
      function_name: functionName,
      hints: hints || [],
      tags: tags || [],
      is_active: true,
    });

    await logAction({
      userId: session.user.id,
      userName: admin.display_name,
      action: 'Challenge Created',
      resource: 'other',
      resourceId: challenge._id.toString(),
      resourceName: title,
      description: `Created challenge: ${title}`,
      changes: {
        difficulty,
        category,
        xpReward,
      },
      status: 'success',
    });

    return NextResponse.json(challenge, { status: 201 });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const admin = await User.findById(session.user.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      id,
      title,
      description,
      prompt,
      difficulty,
      category,
      xpReward,
      timeEstimate,
      language,
      starterCode,
      solutionCode,
      testCases,
      functionName,
      hints,
      tags,
      isActive,
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const oldValues = {
      title: challenge.title,
      difficulty: challenge.difficulty,
      category: challenge.category,
      isActive: challenge.is_active,
    };

    const updatedChallenge = await Challenge.findByIdAndUpdate(
      id,
      {
        title: title || challenge.title,
        description: description || challenge.description,
        prompt: prompt || challenge.prompt,
        difficulty: difficulty || challenge.difficulty,
        category: category || challenge.category,
        xp_reward: xpReward !== undefined ? xpReward : challenge.xp_reward,
        time_estimate: timeEstimate !== undefined ? timeEstimate : challenge.time_estimate,
        language: language || challenge.language,
        starter_code: starterCode !== undefined ? starterCode : challenge.starter_code,
        solution_code: solutionCode !== undefined ? solutionCode : challenge.solution_code,
        test_cases: testCases !== undefined ? testCases : challenge.test_cases,
        function_name: functionName !== undefined ? functionName : challenge.function_name,
        hints: hints !== undefined ? hints : challenge.hints,
        tags: tags !== undefined ? tags : challenge.tags,
        is_active: isActive !== undefined ? isActive : challenge.is_active,
      },
      { returnDocument: 'after' }
    );

    if (!updatedChallenge) {
      return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 });
    }

    await logAction({
      userId: session.user.id,
      userName: admin.display_name,
      action: 'Challenge Updated',
      resource: 'other',
      resourceId: id,
      resourceName: title || challenge.title,
      description: `Updated challenge: ${title || challenge.title}`,
      changes: {
        oldValues,
        newValues: {
          title: updatedChallenge.title,
          difficulty: updatedChallenge.difficulty,
          category: updatedChallenge.category,
          isActive: updatedChallenge.is_active,
        },
      },
      status: 'success',
    });

    return NextResponse.json(updatedChallenge);
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const admin = await User.findById(session.user.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    await Challenge.findByIdAndDelete(id);

    await logAction({
      userId: session.user.id,
      userName: admin.display_name,
      action: 'Challenge Deleted',
      resource: 'other',
      resourceId: id,
      resourceName: challenge.title,
      description: `Deleted challenge: ${challenge.title}`,
      status: 'success',
    });

    return NextResponse.json({ success: true, message: 'Challenge deleted' });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return NextResponse.json({ error: 'Failed to delete challenge' }, { status: 500 });
  }
}
