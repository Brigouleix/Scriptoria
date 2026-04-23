<?php

namespace App\Service;

use App\Entity\Project;
use App\Entity\SnowflakeStep;
use App\Entity\User;
use App\Repository\ProjectRepository;
use App\Repository\SnowflakeStepRepository;
use Doctrine\ORM\EntityManagerInterface;

class ProjectService
{
    public function __construct(
        private readonly EntityManagerInterface   $em,
        private readonly ProjectRepository        $projectRepository,
        private readonly SnowflakeStepRepository  $stepRepository,
    ) {}

    /**
     * Crée un projet et initialise ses 4 étapes Snowflake vides.
     */
    public function create(User $user, array $data): Project
    {
        $project = new Project();
        $project->setUser($user);
        $project->setTitle($data['title']);
        $project->setGenre($data['genre'] ?? null);
        $project->setProjectType($data['project_type'] ?? 'novel');

        $this->em->persist($project);

        // Créer les 4 étapes Snowflake vides
        for ($step = 1; $step <= 4; $step++) {
            $snowflake = new SnowflakeStep();
            $snowflake->setProject($project);
            $snowflake->setStepNumber($step);
            $this->em->persist($snowflake);
        }

        $this->em->flush();

        return $project;
    }

    public function update(Project $project, array $data): Project
    {
        if (isset($data['title']))        $project->setTitle($data['title']);
        if (array_key_exists('genre', $data)) $project->setGenre($data['genre']);
        if (isset($data['cover_url']))    $project->setCoverUrl($data['cover_url']);
        if (isset($data['project_type'])) $project->setProjectType($data['project_type']);

        $this->em->flush();
        return $project;
    }

    public function delete(Project $project): void
    {
        $this->em->remove($project);
        $this->em->flush();
    }

    /**
     * Met à jour le contenu d'une étape Snowflake.
     */
    public function updateStep(Project $project, int $stepNumber, string $content): SnowflakeStep
    {
        $step = $this->stepRepository->findOneByProjectAndStep($project, $stepNumber);

        if (!$step) {
            $step = new SnowflakeStep();
            $step->setProject($project);
            $step->setStepNumber($stepNumber);
            $this->em->persist($step);
        }

        $step->setContent($content);
        $this->em->flush();

        return $step;
    }

    public function serialize(Project $project, bool $withSteps = false): array
    {
        $data = [
            'id'           => (string) $project->getId(),
            'title'        => $project->getTitle(),
            'genre'        => $project->getGenre(),
            'project_type' => $project->getProjectType(),
            'cover_url'    => $project->getCoverUrl(),
            'created_at'   => $project->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updated_at'   => $project->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];

        if ($withSteps) {
            $steps = $this->stepRepository->findByProject($project);
            $data['snowflake_steps'] = array_map(fn($s) => [
                'id'          => (string) $s->getId(),
                'step_number' => $s->getStepNumber(),
                'content'     => $s->getContent(),
                'updated_at'  => $s->getUpdatedAt()->format(\DateTimeInterface::ATOM),
            ], $steps);
        }

        return $data;
    }
}
