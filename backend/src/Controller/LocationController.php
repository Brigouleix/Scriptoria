<?php

namespace App\Controller;

use App\Entity\Location;
use App\Repository\LocationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/locations', name: 'api_locations_')]
#[IsGranted('ROLE_USER')]
class LocationController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly LocationRepository     $locationRepository,
    ) {}

    /**
     * GET /api/locations
     */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user      = $this->getUser();
        $locations = $this->locationRepository->findByUser($user);

        return $this->json([
            'success' => true,
            'data'    => array_map(fn($l) => $this->serialize($l), $locations),
            'meta'    => ['total' => count($locations)],
        ]);
    }

    /**
     * POST /api/locations
     * Body : { "name": "...", "description"?: "..." }
     */
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (empty($data['name'])) {
            return $this->json(['success' => false, 'error' => 'Le nom est requis.'], Response::HTTP_BAD_REQUEST);
        }

        $location = new Location();
        $location->setUser($user);
        $location->setName($data['name']);
        $location->setDescription($data['description'] ?? null);

        $this->em->persist($location);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'data'    => $this->serialize($location),
        ], Response::HTTP_CREATED);
    }

    /**
     * PATCH /api/locations/{id}
     */
    #[Route('/{id}', name: 'update', methods: ['PATCH'])]
    public function update(string $id, Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user     = $this->getUser();
        $location = $this->locationRepository->findOneByIdAndUser($id, $user);

        if (!$location) {
            return $this->json(['success' => false, 'error' => 'Lieu introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (isset($data['name']))        $location->setName($data['name']);
        if (array_key_exists('description', $data)) $location->setDescription($data['description']);

        $this->em->flush();

        return $this->json([
            'success' => true,
            'data'    => $this->serialize($location),
        ]);
    }

    /**
     * DELETE /api/locations/{id}
     */
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user     = $this->getUser();
        $location = $this->locationRepository->findOneByIdAndUser($id, $user);

        if (!$location) {
            return $this->json(['success' => false, 'error' => 'Lieu introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($location);
        $this->em->flush();

        return $this->json(['success' => true, 'data' => null]);
    }

    private function serialize(Location $l): array
    {
        return [
            'id'          => (string) $l->getId(),
            'name'        => $l->getName(),
            'description' => $l->getDescription(),
            'created_at'  => $l->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
