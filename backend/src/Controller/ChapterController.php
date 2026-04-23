<?php

namespace App\Controller;

use App\Entity\Chapter;
use App\Repository\ChapterRepository;
use App\Repository\ProjectRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/projects/{projectId}/chapters', name: 'api_chapters_')]
#[IsGranted('ROLE_USER')]
class ChapterController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ProjectRepository      $projectRepository,
        private readonly ChapterRepository      $chapterRepository,
    ) {}

    /**
     * GET /api/projects/{projectId}/chapters
     */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(string $projectId): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user    = $this->getUser();
        $project = $this->projectRepository->findOneByIdAndUser($projectId, $user);

        if (!$project) {
            return $this->json(['success' => false, 'error' => 'Projet introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $chapters = $this->chapterRepository->findByProject($project);

        return $this->json([
            'success' => true,
            'data'    => array_map(fn($c) => $this->serializeChapter($c), $chapters),
            'meta'    => ['total' => count($chapters)],
        ]);
    }

    /**
     * POST /api/projects/{projectId}/chapters
     * Body : { "title": "...", "description"?: "..." }
     */
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(string $projectId, Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user    = $this->getUser();
        $project = $this->projectRepository->findOneByIdAndUser($projectId, $user);

        if (!$project) {
            return $this->json(['success' => false, 'error' => 'Projet introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (empty($data['title'])) {
            return $this->json(['success' => false, 'error' => 'Le titre est requis.'], Response::HTTP_BAD_REQUEST);
        }

        $chapter = new Chapter();
        $chapter->setProject($project);
        $chapter->setUser($user);
        $chapter->setTitle($data['title']);
        $chapter->setDescription($data['description'] ?? null);
        $chapter->setOrderIndex($this->chapterRepository->getNextOrderIndex($project));

        $this->em->persist($chapter);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'data'    => $this->serializeChapter($chapter),
        ], Response::HTTP_CREATED);
    }

    /**
     * PATCH /api/projects/{projectId}/chapters/{id}
     * Body : { "title"?: "...", "description"?: "...", "order_index"?: 0 }
     */
    #[Route('/{id}', name: 'update', methods: ['PATCH'])]
    public function update(string $projectId, string $id, Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user    = $this->getUser();
        $chapter = $this->chapterRepository->findOneByIdAndUser($id, $user);

        if (!$chapter || (string) $chapter->getProject()->getId() !== $projectId) {
            return $this->json(['success' => false, 'error' => 'Chapitre introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (isset($data['title']))       $chapter->setTitle($data['title']);
        if (array_key_exists('description', $data)) $chapter->setDescription($data['description']);
        if (isset($data['order_index'])) $chapter->setOrderIndex((int) $data['order_index']);

        $this->em->flush();

        return $this->json([
            'success' => true,
            'data'    => $this->serializeChapter($chapter),
        ]);
    }

    /**
     * DELETE /api/projects/{projectId}/chapters/{id}
     */
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $projectId, string $id): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user    = $this->getUser();
        $chapter = $this->chapterRepository->findOneByIdAndUser($id, $user);

        if (!$chapter || (string) $chapter->getProject()->getId() !== $projectId) {
            return $this->json(['success' => false, 'error' => 'Chapitre introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($chapter);
        $this->em->flush();

        return $this->json(['success' => true, 'data' => null]);
    }

    private function serializeChapter(Chapter $c): array
    {
        return [
            'id'          => (string) $c->getId(),
            'project_id'  => (string) $c->getProject()->getId(),
            'title'       => $c->getTitle(),
            'description' => $c->getDescription(),
            'order_index' => $c->getOrderIndex(),
            'created_at'  => $c->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
