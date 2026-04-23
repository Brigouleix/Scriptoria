<?php

namespace App\Repository;

use App\Entity\Project;
use App\Entity\SnowflakeStep;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SnowflakeStep>
 */
class SnowflakeStepRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SnowflakeStep::class);
    }

    public function findByProject(Project $project): array
    {
        return $this->createQueryBuilder('s')
            ->where('s.project = :project')
            ->setParameter('project', $project)
            ->orderBy('s.stepNumber', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOneByProjectAndStep(Project $project, int $step): ?SnowflakeStep
    {
        return $this->findOneBy(['project' => $project, 'stepNumber' => $step]);
    }
}
